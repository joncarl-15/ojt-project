export function isPointInPolygon(point: [number, number], polygon: number[][][]) {
    // Ray casting algorithm for point in polygon
    // polygon is [[[x,y], [x,y], ...]] (GeoJSON structure usually has outer ring as first element)
    const x = point[0], y = point[1];

    let inside = false;
    // We assume the first ring is the outer boundary
    if (!polygon || polygon.length === 0) return false;

    const ring = polygon[0];

    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];

        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
}
