export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidTokenId(tokenId: number): boolean {
  return Number.isInteger(tokenId) && tokenId >= 0;
}

export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

export function isValidDateRange(checkIn: Date, checkOut: Date): boolean {
  return checkOut > checkIn && checkIn >= new Date();
}
