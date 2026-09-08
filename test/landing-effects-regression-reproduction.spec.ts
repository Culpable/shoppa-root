import { expect, test } from '@playwright/test';

test('shown chat replay content is immediately opaque while its transform may animate', async ({ page }) => {
  // The stacked phone layout keeps the mini-chat below the fold, which leaves
  // its replay items hidden until this test advances one item itself.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });

  const replayFrame = await page.locator('.mini-chat > :first-child').evaluate((item) => {
    item.getAnimations().forEach((animation) => animation.cancel());
    item.classList.remove('replay-shown');
    item.classList.add('replay-hidden');
    getComputedStyle(item).opacity;
    item.classList.add('replay-shown');

    const transitions = item.getAnimations().filter(
      (animation): animation is CSSTransition => animation instanceof CSSTransition,
    );
    const opacityTransition = transitions.find((animation) => animation.transitionProperty === 'opacity');
    const transformTransition = transitions.find((animation) => animation.transitionProperty === 'transform');

    // Seek instead of sleeping so the sampled replay frame is deterministic.
    if (opacityTransition) {
      opacityTransition.pause();
      opacityTransition.currentTime = Number(opacityTransition.effect?.getComputedTiming().endTime ?? 0) / 2;
    }
    if (transformTransition) {
      transformTransition.pause();
      transformTransition.currentTime = Number(transformTransition.effect?.getComputedTiming().endTime ?? 0) / 2;
    }

    return {
      opacity: Number(getComputedStyle(item).opacity),
      opacityTransition: Boolean(opacityTransition),
      transform: getComputedStyle(item).transform,
      transformTransition: Boolean(transformTransition),
    };
  });

  expect(replayFrame.transformTransition, 'the replay may still animate its transform').toBe(true);
  expect(
    replayFrame.opacity,
    `shown replay content sampled at the transition midpoint has opacity ${replayFrame.opacity}`,
  ).toBe(1);
  expect(replayFrame.opacityTransition, 'shown replay content must not transition parent opacity').toBe(false);
});

test('LandingEffects does not read geometry after a DOM write in the same task', async ({ page }) => {
  await page.addInitScript(() => {
    type LayoutOperation = { operation: string; stack: string };
    type LayoutHazard = { read: LayoutOperation; write: LayoutOperation };
    const state = window as typeof window & { __landingLayoutHazards?: LayoutHazard[] };
    const hazards: LayoutHazard[] = [];
    let pendingWrite: LayoutOperation | null = null;
    let resetQueued = false;

    const stack = () => new Error().stack ?? '';
    const markWrite = (operation: string) => {
      pendingWrite = { operation, stack: stack() };
      if (resetQueued) return;
      resetQueued = true;
      setTimeout(() => {
        pendingWrite = null;
        resetQueued = false;
      }, 0);
    };
    const recordRead = (operation: string) => {
      if (!pendingWrite) return;
      if (hazards.some((hazard) => (
        hazard.write.operation === pendingWrite?.operation && hazard.read.operation === operation
      ))) return;
      hazards.push({ write: pendingWrite, read: { operation, stack: stack() } });
    };

    const nativeClassAdd = DOMTokenList.prototype.add;
    DOMTokenList.prototype.add = function (...tokens: string[]) {
      markWrite(`classList.add(${tokens.join(', ')})`);
      return nativeClassAdd.apply(this, tokens);
    };

    const nativeAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function <T extends Node>(node: T): T {
      markWrite(`appendChild(${node.nodeName.toLowerCase()})`);
      return nativeAppendChild.call(this, node) as T;
    };

    const nativeRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      recordRead('getBoundingClientRect()');
      return nativeRect.call(this);
    };

    const scrollHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight');
    if (scrollHeight?.get) {
      Object.defineProperty(Element.prototype, 'scrollHeight', {
        ...scrollHeight,
        get() {
          recordRead('scrollHeight');
          return scrollHeight.get!.call(this);
        },
      });
    }

    state.__landingLayoutHazards = hazards;
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  const hazards = await page.evaluate(() => {
    const state = window as typeof window & {
      __landingLayoutHazards?: Array<{
        read: { operation: string; stack: string };
        write: { operation: string; stack: string };
      }>;
    };
    return (state.__landingLayoutHazards ?? []).map(({ read, write }) => ({
      read: read.operation,
      write: write.operation,
      readStack: read.stack.split('\n').slice(1, 5).join('\n'),
      writeStack: write.stack.split('\n').slice(1, 5).join('\n'),
    }));
  });

  expect(
    hazards,
    `unique same-task layout hazards:\n${JSON.stringify(hazards, null, 2)}`,
  ).toEqual([]);
});
