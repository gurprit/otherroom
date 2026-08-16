export type ChaosLevel =
  | 1
  | 2
  | 3
  | 4
  | 5;

export function getChaosLevel(
  visitorMessageCount: number
): ChaosLevel {
  if (visitorMessageCount <= 4) {
    return 1;
  }

  if (visitorMessageCount <= 8) {
    return 2;
  }

  if (visitorMessageCount <= 14) {
    return 3;
  }

  if (visitorMessageCount <= 22) {
    return 4;
  }

  return 5;
}

export function getChaosLabel(
  level: ChaosLevel
) {
  switch (level) {
    case 1:
      return "Normal";

    case 2:
      return "Getting Weird";

    case 3:
      return "Unsettling";

    case 4:
      return "Unhinged";

    case 5:
      return "Beyond Help";
  }
}
