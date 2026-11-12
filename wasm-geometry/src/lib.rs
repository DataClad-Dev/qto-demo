use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn polygon_area(points_flat: &[f64]) -> f64 {
    let n = points_flat.len() / 2;
    if n < 3 {
        return 0.0;
    }
    let mut sum = 0.0;
    for i in 0..n {
        let (x0, y0) = (points_flat[i * 2], points_flat[i * 2 + 1]);
        let j = (i + 1) % n;
        let (x1, y1) = (points_flat[j * 2], points_flat[j * 2 + 1]);
        sum += x0 * y1 - x1 * y0;
    }
    (sum / 2.0).abs()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn unit_square_area_is_one() {
        let pts = [0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0];
        assert!((polygon_area(&pts) - 1.0).abs() < 1e-9);
    }
}
