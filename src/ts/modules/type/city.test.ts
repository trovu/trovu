import CityType from "./city";

test("CityType.parse", async () => {
  expect(
    CityType.parse("75", {
      country: "fr",
      data: { types: { city: { fr: { 75: "Paris" } } } },
    }),
  ).toEqual("Paris");
});
