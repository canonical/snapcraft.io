import { validateRestrictions } from "./fileValidation";

function generateFile(options) {
  const fileContents = "testymctestface";
  return new File([fileContents], "test", options);
}

describe("validateRestrictions", () => {
  let _windowImage;

  beforeEach(() => {
    _windowImage = Object.create(window.Image);
  });

  afterEach(() => {
    window.Image = Object.create(_windowImage);
    window.URL = undefined;
  });

  describe("baseRestrictions", () => {
    it("should return an error if the file is of the wrong type", async () => {
      const file = generateFile({
        type: "text/plain"
      });

      const accept = ["text/html", "text/rich-as-owt"];

      const validation = await validateRestrictions(file, {
        accept: accept
      });

      expect(validation.errors).toEqual([`file type is incorrect`]);
    });

    it("should return an error if a file is too big", async () => {
      const file = generateFile({
        type: "text/html"
      });

      const max = 14; // 14 bytes

      const validation = await validateRestrictions(file, {
        size: {
          max: max
        }
      });

      expect(validation.errors).toEqual([
        `file size is over ${(max / 1000000).toFixed(2)}MB`
      ]);
    });

    it("should return an error if a file is too small", async () => {
      const file = generateFile({
        type: "text/html"
      });

      const min = 16; // 16 bytes

      const validation = await validateRestrictions(file, {
        size: {
          min: min
        }
      });

      expect(validation.errors).toEqual([
        `file size is below ${(min / 1000000).toFixed(2)}MB`
      ]);
    });

    it("should return no errors if the file passes all restrictions", async () => {
      const file = generateFile({
        type: "text/html"
      });

      const restrictions = {
        accept: ["text/html"],
        size: {
          min: 14,
          max: 16
        }
      };

      const validation = await validateRestrictions(file, restrictions);

      expect(validation.errors).toBeUndefined();
    });
  });

  describe("imageRestrictions", () => {
    let restrictions;

    function generateImage(attributes) {
      class Image {
        constructor() {
          this._src = "";
          this.element = document.createElement("image");

          Object.keys(attributes).forEach(key => {
            this[key] = attributes[key];
          });
        }

        addEventListener(type, callback) {
          this.element.addEventListener(type, callback);
        }

        set src(newSrc) {
          this._src = newSrc;
          this.element.dispatchEvent(new Event("load"));
        }

        get src() {
          return this._src;
        }
      }
      window.Image = Image;
    }

    beforeEach(() => {
      restrictions = { accept: ["image/png"] };
      window.URL = {
        createObjectURL: () => {
          return "test.png";
        }
      };
    });

    describe("width", () => {
      it("should return an error if the width is too wide", async () => {
        const file = generateFile({
          type: "image/png"
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10
        });

        const width = {
          min: 0,
          max: 5
        };
        const height = {
          min: 0,
          max: 5
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          width,
          height
        });

        expect(validation.errors).toEqual([
          "has dimensions 10 x 10 pixels. It needs to be at least 0 x 0 and at most 5 x 5 pixels."
        ]);
      });

      it("should return an error if the width is too narrow", async () => {
        const file = generateFile({
          type: "image/png"
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10
        });

        const width = {
          min: 15,
          max: 30
        };

        const height = {
          min: 15,
          max: 30
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          width,
          height
        });

        expect(validation.errors).toEqual([
          "has dimensions 10 x 10 pixels. It needs to be at least 15 x 15 and at most 30 x 30 pixels."
        ]);
      });

      it("should return no error if the width correct", async () => {
        const file = generateFile({
          type: "image/png"
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10
        });

        const width = {
          max: 15,
          min: 5
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          width
        });

        expect(validation.errors).toBeUndefined();
      });
    });

    describe("height", () => {
      it("should return an error if the height is too high", async () => {
        const file = generateFile({
          type: "image/png"
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10
        });

        const width = {
          min: 0,
          max: 5
        };

        const height = {
          min: 0,
          max: 5
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          height,
          width
        });

        expect(validation.errors).toEqual([
          "has dimensions 10 x 10 pixels. It needs to be at least 0 x 0 and at most 5 x 5 pixels."
        ]);
      });

      it("should return an error if the height is too low", async () => {
        const file = generateFile({
          type: "image/png"
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10
        });

        const height = {
          min: 15,
          max: 30
        };

        const width = {
          min: 15,
          max: 30
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          height,
          width
        });

        expect(validation.errors).toEqual([
          "has dimensions 10 x 10 pixels. It needs to be at least 15 x 15 and at most 30 x 30 pixels."
        ]);
      });

      it("should return no error if the height is correct", async () => {
        const file = generateFile({
          type: "image/png"
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10
        });

        const height = {
          max: 15,
          min: 5
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          height
        });

        expect(validation.errors).toBeUndefined();
      });
    });

    describe("aspectRatio", () => {
      it("should return an error if the aspectRatio is too high", async () => {
        const file = generateFile({
          type: "image/png"
        });

        generateImage({
          naturalWidth: 30,
          naturalHeight: 10
        });

        const aspectRatio = {
          min: [1, 1],
          max: [2, 1]
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          aspectRatio
        });

        expect(validation.errors).toEqual([
          "has a width (30 pixels) that is 3.00x its height (10). Its width needs to be between 1x and 2x the height."
        ]);
      });

      it("should return an error if the aspectRatio is too low", async () => {
        const file = generateFile({
          type: "image/png"
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 30
        });

        const aspectRatio = {
          min: [1, 2],
          max: [1, 3]
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          aspectRatio
        });

        expect(validation.errors).toEqual([
          "has a width (10 pixels) that is 0.33x its height (30). Its width needs to be between 0.5x and 0.3333333333333333x the height."
        ]);
      });

      it("should return no error if the aspectRatio is correct", async () => {
        const file = generateFile({
          type: "image/png"
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10
        });

        const aspectRatio = {
          max: [2, 1],
          min: [1, 2]
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          aspectRatio
        });

        expect(validation.errors).toBeUndefined();
      });
    });
  });
});
