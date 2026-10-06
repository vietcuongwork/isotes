import {
  chooseSnap,
  DISMISS,
  dragGeometry,
  nextSegment,
  resolveSnapPoints,
  revealOffset,
  segmentValue,
  shouldDismissDrag,
  shouldDismissOverscroll,
  surfaceHeightAt,
  coveredAt,
  restoreOffset,
  raiseAt,
  MIN_VISIBLE_SCROLL,
  followOffset,
  transitionProgress,
  TAP_SLOP,
  tapDismissesKeyboard,
  viewportDelta,
} from "../sheet/sheetMath";

describe("revealOffset", () => {
  const base = {
    fieldHeight: 48,
    viewportHeight: 300,
    contentHeight: 1200,
    margin: 20,
  };

  it("null when already visible", () =>
    expect(revealOffset({ ...base, fieldY: 100, scrollY: 0 })).toBeNull());
  it("scrolls down just enough", () =>
    expect(revealOffset({ ...base, fieldY: 500, scrollY: 0 })).toBe(
      500 + 48 + 20 - 300,
    ));
  it("scrolls up to the field top minus margin", () =>
    expect(revealOffset({ ...base, fieldY: 100, scrollY: 400 })).toBe(80));
  it("clamps to the scrollable range", () => {
    expect(
      revealOffset({ ...base, fieldY: 1180, fieldHeight: 20, scrollY: 0 }),
    ).toBe(900);
    expect(revealOffset({ ...base, fieldY: 5, scrollY: 300 })).toBe(0);
  });
  it("aligns the top of a field taller than the viewport", () =>
    expect(
      revealOffset({ ...base, fieldY: 400, fieldHeight: 400, scrollY: 0 }),
    ).toBe(380));
  it("null before the viewport is measured", () =>
    expect(
      revealOffset({ ...base, viewportHeight: 0, fieldY: 900, scrollY: 0 }),
    ).toBeNull());
  it("null for sub-pixel moves", () =>
    expect(revealOffset({ ...base, fieldY: 500, scrollY: 267.5 })).toBeNull());
});

describe("shouldDismissDrag", () => {
  it("a fast flick closes even when short", () =>
    expect(shouldDismissDrag(30, 1.5, 600)).toBe(true));
  it("a slow short drag snaps back", () =>
    expect(shouldDismissDrag(60, 0.1, 600)).toBe(false));
  it("a slow long drag closes (30% of the sheet, capped)", () => {
    expect(shouldDismissDrag(DISMISS.maxDistance, 0.1, 600)).toBe(true);
    expect(shouldDismissDrag(90, 0.1, 300)).toBe(true);
    expect(shouldDismissDrag(89, 0.1, 300)).toBe(false);
  });
  it("an unmeasured sheet does not close on a nudge", () =>
    expect(shouldDismissDrag(10, 0.1, 0)).toBe(false));
  it("dragging up never closes", () =>
    expect(shouldDismissDrag(-200, 3, 600)).toBe(false));
});

describe("shouldDismissOverscroll", () => {
  it("not when the content is not pulled past the top", () =>
    expect(shouldDismissOverscroll(0, -5)).toBe(false));
  it("a long pull closes", () =>
    expect(shouldDismissOverscroll(-DISMISS.overscrollDistance, 0)).toBe(true));
  it("a short pull snaps back", () =>
    expect(shouldDismissOverscroll(-30, -0.5)).toBe(false));
  it("a short fast downward flick closes", () =>
    expect(shouldDismissOverscroll(-20, -2)).toBe(true));
});

describe("restoreOffset", () => {
  const session = { baseline: 40, auto: true, manual: false };
  it("goes back to where the user was when only our reveal moved the content", () =>
    expect(restoreOffset(session, 340, 500)).toBe(40));
  it("stays where the user scrolled to", () =>
    expect(restoreOffset({ ...session, manual: true }, 140, 500)).toBe(140));
  it("stays put when nothing moved it", () =>
    expect(restoreOffset({ ...session, auto: false }, 140, 500)).toBe(140));
  it("always lands within the scrollable range", () => {
    expect(restoreOffset({ ...session, baseline: 300 }, 340, 246)).toBe(246);
    expect(restoreOffset({ ...session, manual: true }, 340, 246)).toBe(246);
    expect(restoreOffset(session, 340, -20)).toBe(0); // content shorter than the viewport
  });
});

describe("following the keyboard", () => {
  it("reads progress from the inset in either direction, clamped", () => {
    expect(transitionProgress(0, 0, 256)).toBe(0);
    expect(transitionProgress(64, 0, 256)).toBe(0.25);
    expect(transitionProgress(192, 256, 0)).toBe(0.25); // falling
    expect(transitionProgress(300, 0, 256)).toBe(1);
    expect(transitionProgress(5, 5, 5)).toBe(1); // nothing moves
  });
  it("scrolls in step from where it started and lands with the keyboard", () => {
    expect(followOffset(100, 300, 0, 0)).toBe(100);
    expect(followOffset(100, 300, 0, 0.5)).toBe(200);
    expect(followOffset(100, 300, 0.5, 0.75)).toBe(200); // started mid-transition: the rest of the way
    expect(followOffset(100, 300, 0.5, 1)).toBe(300);
    expect(followOffset(100, 300, 1, 0.2)).toBe(300);
  });
});

describe("tapDismissesKeyboard", () => {
  const tap = {
    moved: 0,
    scrolled: false,
    persistAlways: false,
    hasFocus: true,
    targetTag: 7,
    focusedTag: 3,
  };
  it("a tap on anything but the focused input closes the keyboard", () =>
    expect(tapDismissesKeyboard(tap)).toBe(true));
  it("a tap on the focused input keeps it (moving the caret)", () =>
    expect(tapDismissesKeyboard({ ...tap, targetTag: 3 })).toBe(false));
  it("drags and scrolls keep it", () => {
    expect(tapDismissesKeyboard({ ...tap, moved: TAP_SLOP })).toBe(true);
    expect(tapDismissesKeyboard({ ...tap, moved: TAP_SLOP + 1 })).toBe(false);
    expect(tapDismissesKeyboard({ ...tap, scrolled: true })).toBe(false);
  });
  it('keyboardShouldPersistTaps="always" keeps it', () =>
    expect(tapDismissesKeyboard({ ...tap, persistAlways: true })).toBe(false));
  it("nothing to close without focus; unknown target keeps it", () => {
    expect(tapDismissesKeyboard({ ...tap, hasFocus: false })).toBe(false);
    expect(tapDismissesKeyboard({ ...tap, targetTag: null })).toBe(false);
  });
});

describe("sheet geometry (docked)", () => {
  // iPhone 17-like: 874pt screen, 62pt top inset + 12pt gap -> room 800; header 85 + 96pt strip.
  const g = {
    preferredHeight: 629,
    room: 800,
    safeBottom: 34,
    minAboveKeyboard: 85 + MIN_VISIBLE_SCROLL,
  };
  const short = { ...g, preferredHeight: 320 };

  it("a tall sheet stays put: keyboards slide over it", () => {
    expect(surfaceHeightAt(0, g)).toBe(629);
    expect(surfaceHeightAt(335, g)).toBe(629); // 335 + 181 = 516 still fits below its top
    expect(raiseAt(335, g)).toBe(0);
  });

  it("a short sheet grows just enough to keep the header and a usable strip above the keyboard", () => {
    expect(surfaceHeightAt(0, short)).toBe(320);
    expect(surfaceHeightAt(335, short)).toBe(335 + 181);
    expect(raiseAt(335, short)).toBe(196);
    expect(raiseAt(256, short)).toBe(256 + 181 - 320); // the pad is shorter: a smaller raise
    expect(raiseAt(0, short)).toBe(0);
  });

  it("never grows past the room", () => {
    expect(surfaceHeightAt(700, short)).toBe(800);
  });

  it("a content-sized sheet before it is measured rests at the room", () => {
    const unmeasured = { ...g, preferredHeight: Infinity };
    expect(surfaceHeightAt(0, unmeasured)).toBe(800);
    expect(raiseAt(335, unmeasured)).toBe(0);
  });

  it("the keyboard, or without one the home indicator, covers the scroll area", () => {
    expect(coveredAt(0, g)).toBe(34);
    expect(coveredAt(20, g)).toBe(34);
    expect(coveredAt(335, g)).toBe(335);
  });

  it("predicts the visible scroll area change for a keyboard transition", () => {
    expect(viewportDelta(0, 335, g)).toBe(-(335 - 34)); // the keyboard covers more of a sheet that stays put
    expect(viewportDelta(335, 256, g)).toBe(79); // system -> pad: grows by the height difference
    expect(viewportDelta(0, 335, short)).toBe(516 - 335 - (320 - 34)); // partly offset by the raise
    expect(viewportDelta(256, 256, g)).toBe(0);
  });

  it("a segment passes through both ends, moves linearly, and holds its end for no motion", () => {
    const seg = nextSegment(null, 0, 335, short);
    expect(seg.raise).toEqual([0, 196]);
    expect(segmentValue(seg, 0)).toBe(0);
    expect(segmentValue(seg, 335 / 2)).toBeCloseTo(98); // eases along the keyboard instead of starting late
    expect(segmentValue(seg, 335)).toBe(196);
    expect(segmentValue(nextSegment(null, 256, 256, short), 256)).toBe(
      raiseAt(256, short),
    );
  });

  it("clamps outside its range (a late-arriving segment holds, it does not extrapolate)", () => {
    const seg = nextSegment(null, 256, 0, short); // pad leaving
    expect(segmentValue(seg, -40)).toBe(0);
    expect(segmentValue(seg, 300)).toBe(raiseAt(256, short));
  });

  it("holds the raise through a hand-off between keyboards (no drop and rise again)", () => {
    const padUp = nextSegment(null, 0, 256, short);
    const padLeaving = nextSegment(padUp, 256, 0, short, true); // a field is still focused
    expect(padLeaving.raise).toEqual([
      raiseAt(256, short),
      raiseAt(256, short),
    ]);
    const nativeRising = nextSegment(padLeaving, 0, 335, short);
    expect(nativeRising.raise).toEqual([
      raiseAt(256, short),
      raiseAt(335, short),
    ]); // one move up
  });

  it("starts the next segment from what is displayed, so a hand-off is continuous", () => {
    const padLeaving = nextSegment(null, 256, 0, short);
    const keyboardRising = nextSegment(padLeaving, 0, 335, short);
    expect(segmentValue(keyboardRising, 0)).toBe(segmentValue(padLeaving, 0));
  });

  it("retargeting mid-flight is continuous (starts from the displayed value, not the true geometry)", () => {
    const rising = nextSegment(null, 0, 335, short);
    const mid = 100; // the user switches to the pad while the keyboard is 100pt up
    const displayed = segmentValue(rising, mid);
    expect(displayed).not.toBeCloseTo(raiseAt(mid, short)); // linear != clamped geometry here
    const retarget = nextSegment(rising, mid, 256, short);
    expect(segmentValue(retarget, mid)).toBeCloseTo(displayed);
    expect(segmentValue(retarget, 256)).toBe(raiseAt(256, short));
  });
});

describe("snap mode", () => {
  const snaps = [480, 804]; // ~55% and 92% of an 874pt screen

  it("resolves %, px, sorts, dedupes and limits to the room", () => {
    expect(resolveSnapPoints(["92%", 300, "55%"], 874, 800)).toEqual([
      300, 481, 800,
    ]);
    expect(resolveSnapPoints([500, 500], 874, 800)).toEqual([500]);
  });

  it("drag resizes between snap points, rubber-bands above, translates below", () => {
    expect(dragGeometry(480, -100, snaps)).toEqual({
      height: 580,
      translate: 0,
    });
    expect(dragGeometry(804, -40, snaps)).toEqual({
      height: 814,
      translate: 0,
    }); // 40 * 0.25
    expect(dragGeometry(480, 60, snaps)).toEqual({
      height: 480,
      translate: 60,
    });
  });

  it("a slow release settles on the nearest point", () => {
    expect(chooseSnap(600, 0, snaps)).toBe(0);
    expect(chooseSnap(700, 0, snaps)).toBe(1);
  });

  it("velocity carries the sheet to the next point", () => {
    expect(chooseSnap(560, -1.5, snaps)).toBe(1); // flicked up
    expect(chooseSnap(760, 1.5, snaps)).toBe(0); // flicked down
  });

  it("closes on a long pull or a fast flick below the lowest point; snaps back on a nudge", () => {
    expect(chooseSnap(480 - 200, 0.1, snaps)).toBe("close");
    expect(chooseSnap(480 - 30, 1.5, snaps)).toBe("close");
    expect(chooseSnap(480 - 30, 0.1, snaps)).toBe(0);
  });

  it("a fast flick down from the top point lands on the lower point, not closed", () => {
    expect(chooseSnap(780, 1.5, snaps)).toBe(0);
  });
});
