// Large fixture for DIFF-8 reproduction (inline comment box resize flicker).
export type Record = { id: string; name: string; tags: string[]; score: number };

export function compute1(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-1"));
  return filtered.reduce((total, record) => total + record.score * 1, 0);
}

export function compute2(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-2"));
  return filtered.reduce((total, record) => total + record.score * 2, 0);
}

export function compute3(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-3"));
  return filtered.reduce((total, record) => total + record.score * 3, 0);
}

export function compute4(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-4"));
  return filtered.reduce((total, record) => total + record.score * 4, 0);
}

export function compute5(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-5"));
  return filtered.reduce((total, record) => total + record.score * 5, 0);
}

export function compute6(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-6"));
  return filtered.reduce((total, record) => total + record.score * 6, 0);
}

export function compute7(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-7"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 7 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 7, 0);
}

export function compute8(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-8"));
  return filtered.reduce((total, record) => total + record.score * 8, 0);
}

export function compute9(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-9"));
  return filtered.reduce((total, record) => total + record.score * 9, 0);
}

export function compute10(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-10"));
  return filtered.reduce((total, record) => total + record.score * 10, 0);
}

export function compute11(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-11"));
  return filtered.reduce((total, record) => total + record.score * 11, 0);
}

export function compute12(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-12"));
  return filtered.reduce((total, record) => total + record.score * 12, 0);
}

export function compute13(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-13"));
  return filtered.reduce((total, record) => total + record.score * 13, 0);
}

export function compute14(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-14"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 14 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 14, 0);
}

export function compute15(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-15"));
  return filtered.reduce((total, record) => total + record.score * 15, 0);
}

export function compute16(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-16"));
  return filtered.reduce((total, record) => total + record.score * 16, 0);
}

export function compute17(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-17"));
  return filtered.reduce((total, record) => total + record.score * 17, 0);
}

export function compute18(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-18"));
  return filtered.reduce((total, record) => total + record.score * 18, 0);
}

export function compute19(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-19"));
  return filtered.reduce((total, record) => total + record.score * 19, 0);
}

export function compute20(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-20"));
  return filtered.reduce((total, record) => total + record.score * 20, 0);
}

export function compute21(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-21"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 21 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 21, 0);
}

export function compute22(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-22"));
  return filtered.reduce((total, record) => total + record.score * 22, 0);
}

export function compute23(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-23"));
  return filtered.reduce((total, record) => total + record.score * 23, 0);
}

export function compute24(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-24"));
  return filtered.reduce((total, record) => total + record.score * 24, 0);
}

export function compute25(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-25"));
  return filtered.reduce((total, record) => total + record.score * 25, 0);
}

export function compute26(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-26"));
  return filtered.reduce((total, record) => total + record.score * 26, 0);
}

export function compute27(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-27"));
  return filtered.reduce((total, record) => total + record.score * 27, 0);
}

export function compute28(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-28"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 28 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 28, 0);
}

export function compute29(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-29"));
  return filtered.reduce((total, record) => total + record.score * 29, 0);
}

export function compute30(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-30"));
  return filtered.reduce((total, record) => total + record.score * 30, 0);
}

export function compute31(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-31"));
  return filtered.reduce((total, record) => total + record.score * 31, 0);
}

export function compute32(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-32"));
  return filtered.reduce((total, record) => total + record.score * 32, 0);
}

export function compute33(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-33"));
  return filtered.reduce((total, record) => total + record.score * 33, 0);
}

export function compute34(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-34"));
  return filtered.reduce((total, record) => total + record.score * 34, 0);
}

export function compute35(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-35"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 35 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 35, 0);
}

export function compute36(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-36"));
  return filtered.reduce((total, record) => total + record.score * 36, 0);
}

export function compute37(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-37"));
  return filtered.reduce((total, record) => total + record.score * 37, 0);
}

export function compute38(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-38"));
  return filtered.reduce((total, record) => total + record.score * 38, 0);
}

export function compute39(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-39"));
  return filtered.reduce((total, record) => total + record.score * 39, 0);
}

export function compute40(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-40"));
  return filtered.reduce((total, record) => total + record.score * 40, 0);
}

export function compute41(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-41"));
  return filtered.reduce((total, record) => total + record.score * 41, 0);
}

export function compute42(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-42"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 42 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 42, 0);
}

export function compute43(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-43"));
  return filtered.reduce((total, record) => total + record.score * 43, 0);
}

export function compute44(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-44"));
  return filtered.reduce((total, record) => total + record.score * 44, 0);
}

export function compute45(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-45"));
  return filtered.reduce((total, record) => total + record.score * 45, 0);
}

export function compute46(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-46"));
  return filtered.reduce((total, record) => total + record.score * 46, 0);
}

export function compute47(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-47"));
  return filtered.reduce((total, record) => total + record.score * 47, 0);
}

export function compute48(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-48"));
  return filtered.reduce((total, record) => total + record.score * 48, 0);
}

export function compute49(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-49"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 49 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 49, 0);
}

export function compute50(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-50"));
  return filtered.reduce((total, record) => total + record.score * 50, 0);
}

export function compute51(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-51"));
  return filtered.reduce((total, record) => total + record.score * 51, 0);
}

export function compute52(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-52"));
  return filtered.reduce((total, record) => total + record.score * 52, 0);
}

export function compute53(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-53"));
  return filtered.reduce((total, record) => total + record.score * 53, 0);
}

export function compute54(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-54"));
  return filtered.reduce((total, record) => total + record.score * 54, 0);
}

export function compute55(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-55"));
  return filtered.reduce((total, record) => total + record.score * 55, 0);
}

export function compute56(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-56"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 56 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 56, 0);
}

export function compute57(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-57"));
  return filtered.reduce((total, record) => total + record.score * 57, 0);
}

export function compute58(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-58"));
  return filtered.reduce((total, record) => total + record.score * 58, 0);
}

export function compute59(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-59"));
  return filtered.reduce((total, record) => total + record.score * 59, 0);
}

export function compute60(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-60"));
  return filtered.reduce((total, record) => total + record.score * 60, 0);
}

export function compute61(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-61"));
  return filtered.reduce((total, record) => total + record.score * 61, 0);
}

export function compute62(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-62"));
  return filtered.reduce((total, record) => total + record.score * 62, 0);
}

export function compute63(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-63"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 63 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 63, 0);
}

export function compute64(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-64"));
  return filtered.reduce((total, record) => total + record.score * 64, 0);
}

export function compute65(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-65"));
  return filtered.reduce((total, record) => total + record.score * 65, 0);
}

export function compute66(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-66"));
  return filtered.reduce((total, record) => total + record.score * 66, 0);
}

export function compute67(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-67"));
  return filtered.reduce((total, record) => total + record.score * 67, 0);
}

export function compute68(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-68"));
  return filtered.reduce((total, record) => total + record.score * 68, 0);
}

export function compute69(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-69"));
  return filtered.reduce((total, record) => total + record.score * 69, 0);
}

export function compute70(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-70"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 70 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 70, 0);
}

export function compute71(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-71"));
  return filtered.reduce((total, record) => total + record.score * 71, 0);
}

export function compute72(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-72"));
  return filtered.reduce((total, record) => total + record.score * 72, 0);
}

export function compute73(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-73"));
  return filtered.reduce((total, record) => total + record.score * 73, 0);
}

export function compute74(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-74"));
  return filtered.reduce((total, record) => total + record.score * 74, 0);
}

export function compute75(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-75"));
  return filtered.reduce((total, record) => total + record.score * 75, 0);
}

export function compute76(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-76"));
  return filtered.reduce((total, record) => total + record.score * 76, 0);
}

export function compute77(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-77"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 77 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 77, 0);
}

export function compute78(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-78"));
  return filtered.reduce((total, record) => total + record.score * 78, 0);
}

export function compute79(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-79"));
  return filtered.reduce((total, record) => total + record.score * 79, 0);
}

export function compute80(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-80"));
  return filtered.reduce((total, record) => total + record.score * 80, 0);
}

export function compute81(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-81"));
  return filtered.reduce((total, record) => total + record.score * 81, 0);
}

export function compute82(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-82"));
  return filtered.reduce((total, record) => total + record.score * 82, 0);
}

export function compute83(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-83"));
  return filtered.reduce((total, record) => total + record.score * 83, 0);
}

export function compute84(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-84"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 84 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 84, 0);
}

export function compute85(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-85"));
  return filtered.reduce((total, record) => total + record.score * 85, 0);
}

export function compute86(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-86"));
  return filtered.reduce((total, record) => total + record.score * 86, 0);
}

export function compute87(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-87"));
  return filtered.reduce((total, record) => total + record.score * 87, 0);
}

export function compute88(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-88"));
  return filtered.reduce((total, record) => total + record.score * 88, 0);
}

export function compute89(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-89"));
  return filtered.reduce((total, record) => total + record.score * 89, 0);
}

export function compute90(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-90"));
  return filtered.reduce((total, record) => total + record.score * 90, 0);
}

export function compute91(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-91"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 91 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 91, 0);
}

export function compute92(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-92"));
  return filtered.reduce((total, record) => total + record.score * 92, 0);
}

export function compute93(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-93"));
  return filtered.reduce((total, record) => total + record.score * 93, 0);
}

export function compute94(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-94"));
  return filtered.reduce((total, record) => total + record.score * 94, 0);
}

export function compute95(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-95"));
  return filtered.reduce((total, record) => total + record.score * 95, 0);
}

export function compute96(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-96"));
  return filtered.reduce((total, record) => total + record.score * 96, 0);
}

export function compute97(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-97"));
  return filtered.reduce((total, record) => total + record.score * 97, 0);
}

export function compute98(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-98"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 98 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 98, 0);
}

export function compute99(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-99"));
  return filtered.reduce((total, record) => total + record.score * 99, 0);
}

export function compute100(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-100"));
  return filtered.reduce((total, record) => total + record.score * 100, 0);
}

export function compute101(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-101"));
  return filtered.reduce((total, record) => total + record.score * 101, 0);
}

export function compute102(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-102"));
  return filtered.reduce((total, record) => total + record.score * 102, 0);
}

export function compute103(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-103"));
  return filtered.reduce((total, record) => total + record.score * 103, 0);
}

export function compute104(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-104"));
  return filtered.reduce((total, record) => total + record.score * 104, 0);
}

export function compute105(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-105"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 105 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 105, 0);
}

export function compute106(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-106"));
  return filtered.reduce((total, record) => total + record.score * 106, 0);
}

export function compute107(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-107"));
  return filtered.reduce((total, record) => total + record.score * 107, 0);
}

export function compute108(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-108"));
  return filtered.reduce((total, record) => total + record.score * 108, 0);
}

export function compute109(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-109"));
  return filtered.reduce((total, record) => total + record.score * 109, 0);
}

export function compute110(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-110"));
  return filtered.reduce((total, record) => total + record.score * 110, 0);
}

export function compute111(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-111"));
  return filtered.reduce((total, record) => total + record.score * 111, 0);
}

export function compute112(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-112"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 112 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 112, 0);
}

export function compute113(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-113"));
  return filtered.reduce((total, record) => total + record.score * 113, 0);
}

export function compute114(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-114"));
  return filtered.reduce((total, record) => total + record.score * 114, 0);
}

export function compute115(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-115"));
  return filtered.reduce((total, record) => total + record.score * 115, 0);
}

export function compute116(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-116"));
  return filtered.reduce((total, record) => total + record.score * 116, 0);
}

export function compute117(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-117"));
  return filtered.reduce((total, record) => total + record.score * 117, 0);
}

export function compute118(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-118"));
  return filtered.reduce((total, record) => total + record.score * 118, 0);
}

export function compute119(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-119"));
  const summary = filtered.map(record => `${record.id}:${record.name}:${record.score.toFixed(2)}`).join(", ") + " // long line 119 " + "x".repeat(4) + " padding padding padding padding padding padding padding padding padding";
  void summary;
  return filtered.reduce((total, record) => total + record.score * 119, 0);
}

export function compute120(records: Record[], threshold: number): number {
  const filtered = records.filter(record => record.score > threshold && record.tags.includes("group-120"));
  return filtered.reduce((total, record) => total + record.score * 120, 0);
}

