import { Song, UserData, Playlist, UserFeedback, UploadAction } from "./types";
import { Runtype, Static, Success, Failure } from "runtypes";

export type DecodeResult<T> = (Success<T> | Failure) & {
  _unsafeUnwrap: () => T;
};

export const decode = <V extends Runtype<any>>(
  data: unknown,
  record: V,
): DecodeResult<Static<V>> => {
  const result = record.validate(data);
  if (result.success) {
    return {
      ...result,
      _unsafeUnwrap: () => result.value,
    };
  } else {
    return {
      ...result,
      _unsafeUnwrap: () => {
        throw Error(`${result.message}${result.key ? ` (${result.key})` : ""}`);
      },
    };
  }
};

// at least six characters
// at least one number, one lowercase and one uppercase letter
export const isPasswordValid = (password: string) => {
  return /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(password);
};

export const isDefined = <T>(value: T | undefined | null): value is T =>
  value !== null && value !== undefined;

// http://stackoverflow.com/a/6969486/692528
// eslint-disable-next-line no-useless-escape
const escapeRegExp = (str: string) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

const create = (chars: string[]) => {
  const charCodes = chars.map((c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

  const charToCode: Record<string, string> = {};
  const codeToChar: Record<string, string> = {};
  chars.forEach((c, i) => {
    charToCode[c] = charCodes[i];
    codeToChar[charCodes[i]] = c;
  });

  const charsRegex = new RegExp(`[${escapeRegExp(chars.join(""))}]`, "g");
  const charCodesRegex = new RegExp(charCodes.join("|"), "g");

  const encode = (str: string) => str.replace(charsRegex, (match) => charToCode[match]);
  const decode = (str: string) => str.replace(charCodesRegex, (match) => codeToChar[match]);

  return { encode, decode };
};

// http://stackoverflow.com/a/19148116/692528
export const { encode: encodeFirebase, decode: decodeFirebase } = create(".$[]#/%".split(""));

export function removedUndefinedValues<T>(obj: T): T {
  for (const propName in obj) {
    if (obj[propName] === undefined) {
      delete obj[propName];
    }
  }

  return obj;
}

export const fromEntries = <T extends string, V>(iterable: Array<[T, V]>): Record<T, V> => {
  return [...iterable].reduce((obj, [key, val]) => {
    (obj as any)[key] = val;
    return obj;
  }, {}) as Record<T, V>;
};
