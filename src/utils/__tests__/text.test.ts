import { foldForSearch } from "@/utils/text";

describe("foldForSearch", () => {
  it("drops the accent marks Vietnamese names carry", () => {
    expect(foldForSearch("Tuấn")).toBe("tuan");
  });

  it("maps đ and Đ to d, which have no accent split", () => {
    expect(foldForSearch("Đức")).toBe("duc");
    expect(foldForSearch("đạt")).toBe("dat");
  });

  it("maps ł to l, which has no accent split", () => {
    expect(foldForSearch("Złoty")).toBe("zloty");
  });

  it("trims and lowercases", () => {
    expect(foldForSearch(" MAI ")).toBe("mai");
  });
});
