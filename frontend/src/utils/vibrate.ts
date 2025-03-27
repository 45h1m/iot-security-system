export function vibrate() {
    if(navigator.vibrate) navigator.vibrate([
        100, 30, 100, 30, 100, 30, 200, 30, 200, 30, 200, 30, 100, 30, 100, 30, 100,
      ]);
}