/**
 * Utility functions for handling gift card images
 */

/**
 * Get the image URL for a gift card based on its number
 * @param {number} imageNumber - The image number (1-30)
 * @returns {string} The full image URL
 */
function getGiftCardImageUrl(imageNumber) {
  const paddedNumber = String(imageNumber).padStart(2, '0');
  return `/assets/images/gift-cards/image_${paddedNumber}.jpg`;
}

/**
 * Get all available gift card images
 * @returns {Array} Array of gift card image objects
 */
function getAvailableGiftCardImages() {
  const images = [];
  for (let i = 1; i <= 30; i++) {
    images.push({
      id: i,
      number: i,
      name: `Gift Card ${i}`,
      url: getGiftCardImageUrl(i)
    });
  }
  return images;
}

/**
 * Validate if an image number is valid
 * @param {number} imageNumber - The image number to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidImageNumber(imageNumber) {
  return Number.isInteger(imageNumber) && imageNumber >= 1 && imageNumber <= 30;
}

module.exports = {
  getGiftCardImageUrl,
  getAvailableGiftCardImages,
  isValidImageNumber
};