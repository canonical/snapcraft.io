import { validateRestrictions } from "./fileValidation";

function generateFile(
  options,
  name = "test",
  fileContents = "testymctestface",
) {
  return new File([fileContents], name, options);
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
        type: "text/plain",
      });

      const accept = ["text/html", "text/rich-as-owt"];

      const validation = await validateRestrictions(file, {
        accept: accept,
      });

      expect(validation.errors).toEqual([`file type is incorrect`]);
    });

    it("should return an error if a small file is too big", async () => {
      const smallFile = generateFile({}, "test", "a".repeat(2000));
      const largeFile = generateFile({}, "test", "a".repeat(2000000));

      const smallRestrictions = {
        size: {
          min: 1,
          max: 1000,
        },
      };

      const validationSmall = await validateRestrictions(
        smallFile,
        smallRestrictions,
      );

      expect(validationSmall.errors).toEqual([`file size is over 1KB`]);

      const largeRestrictions = {
        size: {
          min: 1,
          max: 1000000,
        },
      };

      const validationLarge = await validateRestrictions(
        largeFile,
        largeRestrictions,
      );

      expect(validationLarge.errors).toEqual([`file size is over 1.00MB`]);
    });

    it("should return an error if a file is too small", async () => {
      const smallFile = generateFile({}, "test", "a".repeat(1000));
      const largeFile = generateFile({}, "test", "a".repeat(1000000));

      const smallRestrictions = {
        size: {
          min: 2000,
          max: 5000,
        },
      };

      const validationSmall = await validateRestrictions(
        smallFile,
        smallRestrictions,
      );

      expect(validationSmall.errors).toEqual([`file size is below 2KB`]);

      const largeRestrictions = {
        size: {
          min: 2000000,
          max: 5000000,
        },
      };

      const validationLarge = await validateRestrictions(
        largeFile,
        largeRestrictions,
      );

      expect(validationLarge.errors).toEqual([`file size is below 2.00MB`]);
    });

    it("should return no errors if the file passes all restrictions", async () => {
      const file = generateFile({
        type: "text/html",
      });

      const restrictions = {
        accept: ["text/html"],
        size: {
          min: 14,
          max: 16,
        },
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

          Object.keys(attributes).forEach((key) => {
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
        },
      };
    });

    describe("width", () => {
      it("should return an error if the width is too wide", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10,
        });

        const width = {
          min: 0,
          max: 5,
        };
        const height = {
          min: 0,
          max: 5,
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          width,
          height,
        });

        expect(validation.errors).toEqual([
          "has dimensions 10 x 10 pixels. It needs to be at least 0 x 0 and at most 5 x 5 pixels.",
        ]);
      });

      it("should return an error if the width is too narrow", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10,
        });

        const width = {
          min: 15,
          max: 30,
        };

        const height = {
          min: 15,
          max: 30,
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          width,
          height,
        });

        expect(validation.errors).toEqual([
          "has dimensions 10 x 10 pixels. It needs to be at least 15 x 15 and at most 30 x 30 pixels.",
        ]);
      });

      it("should return no error if the width correct", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10,
        });

        const width = {
          max: 15,
          min: 5,
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          width,
        });

        expect(validation.errors).toBeUndefined();
      });
    });

    describe("height", () => {
      it("should return an error if the height is too high", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10,
        });

        const width = {
          min: 0,
          max: 5,
        };

        const height = {
          min: 0,
          max: 5,
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          height,
          width,
        });

        expect(validation.errors).toEqual([
          "has dimensions 10 x 10 pixels. It needs to be at least 0 x 0 and at most 5 x 5 pixels.",
        ]);
      });

      it("should return an error if the height is too low", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10,
        });

        const height = {
          min: 15,
          max: 30,
        };

        const width = {
          min: 15,
          max: 30,
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          height,
          width,
        });

        expect(validation.errors).toEqual([
          "has dimensions 10 x 10 pixels. It needs to be at least 15 x 15 and at most 30 x 30 pixels.",
        ]);
      });

      it("should return no error if the height is correct", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10,
        });

        const height = {
          max: 15,
          min: 5,
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          height,
        });

        expect(validation.errors).toBeUndefined();
      });
    });

    describe("aspectRatio", () => {
      it("should return an error if the aspectRatio is too high", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 30,
          naturalHeight: 10,
        });

        const aspectRatio = {
          min: [1, 1],
          max: [2, 1],
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          aspectRatio,
        });

        expect(validation.errors).toEqual([
          "(30 x 10 pixels) does not have the correct aspect ratio: it needs to be between 1:1 and 2:1",
        ]);
      });

      it("should return an error if the aspectRatio is too low", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 15,
        });

        const aspectRatio = {
          min: [1, 2],
          max: [1, 3],
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          aspectRatio,
        });

        expect(validation.errors).toEqual([
          "(10 x 15 pixels) does not have the correct aspect ratio: it needs to be between 1:2 and 1:3",
        ]);
      });

      it("should return an error if only one aspectRatio is allowed and the ratio is too high", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 30,
          naturalHeight: 11,
        });

        const aspectRatio = {
          min: [3, 1],
          max: [3, 1],
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          aspectRatio,
        });

        expect(validation.errors).toEqual([
          "(30 x 11 pixels) does not have the correct aspect ratio: it needs to be 3:1 (e.g., 33 x 11 pixels)",
        ]);
      });

      it("should return an error if aspectRatio is too high and the suggested size would be larger than the size restriction", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 110,
          naturalHeight: 50,
        });

        const aspectRatio = {
          min: [2, 1],
          max: [2, 1],
        };

        const width = {
          min: 50,
          max: 200,
        };
        const height = {
          min: 25,
          max: 50,
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          aspectRatio,
          width,
          height,
        });

        expect(validation.errors).toEqual([
          "(110 x 50 pixels) does not have the correct aspect ratio: it needs to be 2:1 (e.g., 100 x 50 pixels)",
        ]);
      });

      it("should return a cropable size if the ratio is incorrect", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 1444,
          naturalHeight: 482,
        });

        const aspectRatio = {
          min: [3, 1],
          max: [3, 1],
        };

        const width = {
          min: 720,
          max: 4320,
        };

        const height = {
          min: 240,
          max: 1440,
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          aspectRatio,
          width,
          height,
        });

        expect(validation.errors).toEqual([
          "(1444 x 482 pixels) does not have the correct aspect ratio: it needs to be 3:1 (e.g., 1446 x 482 pixels)",
        ]);
      });

      it("should return no error if the aspectRatio is correct", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 10,
        });

        const aspectRatio = {
          max: [1, 1],
          min: [1, 1],
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          aspectRatio,
        });

        expect(validation.errors).toBeUndefined();
      });

      it("should return no error if the aspectRatio is within range", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 10,
          naturalHeight: 20,
        });

        let aspectRatio = {
          min: [1, 2],
          max: [1, 3],
        };

        let validation = await validateRestrictions(file, {
          ...restrictions,
          aspectRatio,
        });

        expect(validation.errors).toBeUndefined();

        generateImage({
          naturalWidth: 10,
          naturalHeight: 25,
        });

        aspectRatio = {
          min: [1, 2],
          max: [1, 3],
        };

        validation = await validateRestrictions(file, {
          ...restrictions,
          aspectRatio,
        });

        expect(validation.errors).toBeUndefined();

        generateImage({
          naturalWidth: 10,
          naturalHeight: 30,
        });

        aspectRatio = {
          min: [1, 2],
          max: [1, 3],
        };

        validation = await validateRestrictions(file, {
          ...restrictions,
          aspectRatio,
        });

        expect(validation.errors).toBeUndefined();
      });
    });

    describe("whitelist", () => {
      it("should return errors if the image size isn't in the whitelist and doesn't pass validation", async () => {
        const file = generateFile({
          type: "image/png",
        });

        generateImage({
          naturalWidth: 1218,
          naturalHeight: 240,
        });

        const width = {
          min: 720,
          max: 3840,
        };

        const height = {
          min: 240,
          max: 1440,
        };

        const aspectRatio = {
          min: [3, 1],
          max: [3, 1],
        };

        const validation = await validateRestrictions(file, {
          ...restrictions,
          width,
          height,
          aspectRatio,
        });

        expect(validation.errors).toEqual([
          "(1218 x 240 pixels) does not have the correct aspect ratio: it needs to be 3:1 (e.g., 720 x 240 pixels)",
        ]);
      });

      it("should return no errors if the image attributes are in the whitelist", async () => {
        const file = generateFile(
          {
            type: "image/png",
          },
          "test.png",
        );

        generateImage({
          naturalWidth: 1218,
          naturalHeight: 240,
        });

        const width = {
          min: 720,
          max: 3840,
        };

        const height = {
          min: 240,
          max: 1440,
        };

        const aspectRatio = {
          min: [3, 1],
          max: [3, 1],
        };

        const whitelist = [
          {
            dimensions: [1218, 240],
            fileName: "test",
            accept: ["image/png"],
          },
        ];

        const validation = await validateRestrictions(file, {
          ...restrictions,
          width,
          height,
          aspectRatio,
          whitelist,
        });

        expect(validation.errors).toBeUndefined();
      });

      it("should return errors if the image dimensions aren't in the whitelist", async () => {
        const file = generateFile(
          {
            type: "image/png",
          },
          "test.png",
        );

        generateImage({
          naturalWidth: 1219,
          naturalHeight: 241,
        });

        const width = {
          min: 720,
          max: 3840,
        };

        const height = {
          min: 240,
          max: 1440,
        };

        const aspectRatio = {
          min: [3, 1],
          max: [3, 1],
        };

        const whitelist = [
          {
            dimensions: [1218, 240],
            fileName: "test",
            accept: ["image/png"],
          },
        ];

        const validation = await validateRestrictions(file, {
          ...restrictions,
          width,
          height,
          aspectRatio,
          whitelist,
        });

        expect(validation.errors).toBeDefined();
      });

      it("should return errors if the image name isn't in the whitelist", async () => {
        const file = generateFile(
          {
            type: "image/png",
          },
          "green.png",
        );

        generateImage({
          naturalWidth: 1218,
          naturalHeight: 240,
        });

        const width = {
          min: 720,
          max: 3840,
        };

        const height = {
          min: 240,
          max: 1440,
        };

        const aspectRatio = {
          min: [3, 1],
          max: [3, 1],
        };

        const whitelist = [
          {
            dimensions: [1218, 240],
            fileName: "test",
            accept: ["image/png"],
          },
        ];

        const validation = await validateRestrictions(file, {
          ...restrictions,
          width,
          height,
          aspectRatio,
          whitelist,
        });

        expect(validation.errors).toBeDefined();
      });

      it("should return errors if the image type isn't in the whitelist", async () => {
        const file = generateFile(
          {
            type: "image/png",
          },
          "test.png",
        );

        generateImage({
          naturalWidth: 1218,
          naturalHeight: 240,
        });

        const width = {
          min: 720,
          max: 3840,
        };

        const height = {
          min: 240,
          max: 1440,
        };

        const aspectRatio = {
          min: [3, 1],
          max: [3, 1],
        };

        const whitelist = [
          {
            dimensions: [1218, 240],
            fileName: "test",
            accept: ["text/html"],
          },
        ];

        const validation = await validateRestrictions(file, {
          ...restrictions,
          width,
          height,
          aspectRatio,
          whitelist,
        });

        expect(validation.errors).toBeDefined();
      });
    });
  });
});
