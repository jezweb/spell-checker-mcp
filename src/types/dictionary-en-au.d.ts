declare module 'dictionary-en-au' {
  interface Dictionary {
    aff: Buffer | Uint8Array;
    dic: Buffer | Uint8Array;
  }

  const dictionaryEnAu: Promise<Dictionary>;
  export default dictionaryEnAu;
}
