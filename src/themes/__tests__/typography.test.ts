import { textStyle } from "@/themes/typography";

describe("textStyle", () => {
  it.each(["hero-amount", "amount", "amount-lg"])(
    "gives the %s role tabular figures",
    (role) => {
      expect(textStyle(role).fontVariant).toEqual(["tabular-nums"]);
    },
  );

  it("leaves proportional figures on text roles", () => {
    expect(textStyle("body")).not.toHaveProperty("fontVariant");
  });
});
