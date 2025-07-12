export class Utils {
  static InvaderFormat(order: number): string {
    return order < 10 ? "0" + order : "" + order;
  }
}
