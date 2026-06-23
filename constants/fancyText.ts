export interface FancyTextStyle {
  name: string;
  convert: (text: string) => string;
}

export const FANCY_TEXT_STYLES: FancyTextStyle[] = [
  {
    name: "Bold",
    convert: (t) =>
      t
        .split("")
        .map((c) => String.fromCodePoint(c.codePointAt(0)! + 0x1d400 - 0x41 + (c >= "a" ? 26 : 0)))
        .join(""),
  },
  {
    name: "Italic",
    convert: (t) =>
      t
        .split("")
        .map((c) => {
          const code = c.codePointAt(0)!;
          if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1d434 - 65);
          if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1d44e - 97);
          return c;
        })
        .join(""),
  },
  {
    name: "Bold Italic",
    convert: (t) =>
      t
        .split("")
        .map((c) => {
          const code = c.codePointAt(0)!;
          if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1d468 - 65);
          if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1d482 - 97);
          return c;
        })
        .join(""),
  },
  {
    name: "Script",
    convert: (t) =>
      t
        .split("")
        .map((c) => {
          const code = c.codePointAt(0)!;
          if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1d49c - 65);
          if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1d4b6 - 97);
          return c;
        })
        .join(""),
  },
  {
    name: "Bold Script",
    convert: (t) =>
      t
        .split("")
        .map((c) => {
          const code = c.codePointAt(0)!;
          if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1d4d0 - 65);
          if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1d4ea - 97);
          return c;
        })
        .join(""),
  },
  {
    name: "Fraktur",
    convert: (t) =>
      t
        .split("")
        .map((c) => {
          const code = c.codePointAt(0)!;
          if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1d504 - 65);
          if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1d51e - 97);
          return c;
        })
        .join(""),
  },
  {
    name: "Double-Struck",
    convert: (t) =>
      t
        .split("")
        .map((c) => {
          const code = c.codePointAt(0)!;
          if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1d538 - 65);
          if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1d552 - 97);
          return c;
        })
        .join(""),
  },
  {
    name: "Monospace",
    convert: (t) =>
      t
        .split("")
        .map((c) => {
          const code = c.codePointAt(0)!;
          if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1d670 - 65);
          if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1d68a - 97);
          return c;
        })
        .join(""),
  },
  {
    name: "Circled",
    convert: (t) =>
      t
        .split("")
        .map((c) => {
          const code = c.codePointAt(0)!;
          if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x24b6 - 65);
          if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x24d0 - 97);
          return c;
        })
        .join(""),
  },
  {
    name: "Negative Circled",
    convert: (t) =>
      t
        .split("")
        .map((c) => {
          const code = c.codePointAt(0)!;
          if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1f150 - 65);
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x1f150 + (code - 97));
          return c;
        })
        .join(""),
  },
  {
    name: "Squared",
    convert: (t) =>
      t
        .split("")
        .map((c) => {
          const code = c.codePointAt(0)!;
          if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1f130 - 65);
          return c;
        })
        .join(""),
  },
  {
    name: "Small Caps",
    convert: (t) =>
      t
        .split("")
        .map((c) => {
          const code = c.codePointAt(0)!;
          if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1d56c - 65);
          return c;
        })
        .join(""),
  },
  {
    name: "Upside Down",
    convert: (t) => {
      const map: Record<string, string> = {
        a: "\u0250",
        b: "q",
        c: "\u0254",
        d: "p",
        e: "\u01DD",
        f: "\u025F",
        g: "\u0253",
        h: "\u0265",
        i: "\u0131",
        j: "\u027E",
        k: "\u029E",
        l: "l",
        m: "\u026F",
        n: "u",
        o: "o",
        p: "d",
        q: "b",
        r: "\u0279",
        s: "s",
        t: "\u0287",
        u: "n",
        v: "\u028C",
        w: "\u028D",
        x: "x",
        y: "\u028E",
        z: "z",
        A: "\u2200",
        B: "\u15FA",
        C: "\u0186",
        D: "\u15E1",
        E: "\u018E",
        F: "\u2132",
        G: "\u2141",
        H: "H",
        I: "I",
        J: "\u017F",
        K: "\u22CA",
        L: "\u2142",
        M: "W",
        N: "N",
        O: "O",
        P: "\u0500",
        Q: "\u038C",
        R: "\u1D1A",
        S: "S",
        T: "\u22A5",
        U: "\u2229",
        V: "\u039B",
        W: "M",
        X: "X",
        Y: "\u2144",
        Z: "Z",
        "1": "\u0196",
        "2": "\u1105",
        "3": "\u0190",
        "4": "\u3123",
        "5": "\u03DB",
        "6": "9",
        "7": "\u3125",
        "8": "8",
        "9": "6",
        "0": "0",
        ".": "\u02D9",
        ",": "'",
        "'": ",",
        "?": "\u00BF",
        "!": "\u00A1",
        "(": ")",
        ")": "(",
        "[": "]",
        "]": "[",
        "<": ">",
        ">": "<",
        "&": "\u214B",
        _: "\u203E",
      };
      return t
        .split("")
        .reverse()
        .map((c) => map[c] ?? c)
        .join("");
    },
  },
  {
    name: "Fullwidth",
    convert: (t) =>
      t
        .split("")
        .map((c) => {
          const code = c.codePointAt(0)!;
          if (code >= 33 && code <= 126) return String.fromCodePoint(code + 0xff01 - 33);
          if (code === 32) return "\u3000";
          return c;
        })
        .join(""),
  },
  {
    name: "Strikethrough",
    convert: (t) =>
      t
        .split("")
        .map((c) => c + "\u0336")
        .join(""),
  },
  {
    name: "Underlined",
    convert: (t) =>
      t
        .split("")
        .map((c) => c + "\u0332")
        .join(""),
  },
  {
    name: "Overlined",
    convert: (t) =>
      t
        .split("")
        .map((c) => c + "\u0305")
        .join(""),
  },
];

/** Simplified fancy text converter that works for all ASCII letters */
export function fancyConvert(text: string, styleIndex: number): string {
  const style = FANCY_TEXT_STYLES[styleIndex];
  if (!style) return text;
  return style.convert(text);
}
