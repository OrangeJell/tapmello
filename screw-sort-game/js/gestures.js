// Distinguish a tap from a drag while the browser handles page scrolling.
export class TapGate {
  current = null;

  begin(id, x, y) {
    this.current = { id, x, y, moved: false };
  }

  cancel() {
    this.current = null;
  }

  move(id, x, y) {
    const tap = this.current;
    if (tap?.id === id && Math.hypot(x - tap.x, y - tap.y) > 10) {
      tap.moved = true;
    }
  }

  end(id, x, y) {
    const tap = this.current;
    if (tap?.id !== id) return false;

    this.move(id, x, y);
    this.cancel();
    return !tap.moved;
  }
}
