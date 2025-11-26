/**
 * Converts a linear value (0-1) to a logarithmic value within a specified range.
 * Useful for frequency sliders where human perception is logarithmic.
 * 
 * @param value - Normalized linear input value (0 to 1)
 * @param min - Minimum value of the output range (must be > 0)
 * @param max - Maximum value of the output range
 * @returns The logarithmic value mapped to the range [min, max]
 */
export const linearToLog = (value: number, min: number, max: number): number => {
    if (value <= 0) return min;
    if (value >= 1) return max;
    if (min <= 0) min = 0.0001; // Prevent log(0) issues

    // Formula: y = min * (max / min)^x
    return min * Math.pow(max / min, value);
};

/**
 * Converts a logarithmic value within a specified range to a linear value (0-1).
 * Useful for setting slider positions from actual frequency values.
 * 
 * @param value - Logarithmic input value
 * @param min - Minimum value of the range (must be > 0)
 * @param max - Maximum value of the range
 * @returns Normalized linear value (0 to 1)
 */
export const logToLinear = (value: number, min: number, max: number): number => {
    if (value <= min) return 0;
    if (value >= max) return 1;
    if (min <= 0) min = 0.0001;

    // Inverse formula: x = log(y / min) / log(max / min)
    return Math.log(value / min) / Math.log(max / min);
};

/**
 * Converts a decibel value to linear gain amplitude.
 * 
 * @param db - Value in decibels (e.g., -6, 0, 6)
 * @returns Linear gain amplitude (e.g., 0.5, 1.0, 2.0)
 */
export const dbToGain = (db: number): number => {
    return Math.pow(10, db / 20);
};
