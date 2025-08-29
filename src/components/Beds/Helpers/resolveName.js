export const resolveWardName = (bed) => {
  // 1️⃣ API may already return populated name
  if (bed.wardName) return bed.wardName;

  // 2️⃣ floorId could be object
  if (bed.wardId && typeof bed.wardId === "object") {
    if (bed.wardId.wardName) return bed.wardId.wardName;
    if (bed.wardId._id) {
      return (
        Object.keys(wardMap).find((n) => wardMap[n] === bed.wardId._id) || ""
      );
    }
  }

  // 3️⃣ floorId string
  if (typeof bed.wardId === "string") {
    return Object.keys(wardMap).find((n) => wardMap[n] === bed.wardId) || "";
  }

  return "";
};

export const resolveFloorName = (bed) => {
    // 1️⃣ API may already return populated name
    if (bed.floorName) return bed.floorName;

    // 2️⃣ floorId could be object
    if (bed.floorId && typeof bed.floorId === "object") {
      if (bed.floorId.floorName) return bed.floorId.floorName;
      if (bed.floorId._id) {
        return (
          Object.keys(floorMap).find((n) => floorMap[n] === bed.floorId._id) ||
          ""
        );
      }
    }

    // 3️⃣ floorId string
    if (typeof bed.floorId === "string") {
      return (
        Object.keys(floorMap).find((n) => floorMap[n] === bed.floorId) || ""
      );
    }

    return "";
  };