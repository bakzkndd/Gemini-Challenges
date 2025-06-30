export function calculateFibonacci(number: number) : number {
    if (number <= 1) {
        return number;
    }
    return calculateFibonacci(number - 1) + calculateFibonacci(number - 2);
}

export function evenFibonacciSum(limit: number) : number {
    let sum = 0;
    let number = 0;
    let result = 0;
    while (result < limit) {
        result = calculateFibonacci(number);
        if (result % 2 === 0) {
            sum += result;
        }
        number++;
    }
    return sum;
}

export function evenFibonacciSumChallenge(): number {
    return evenFibonacciSum(4000000);
}