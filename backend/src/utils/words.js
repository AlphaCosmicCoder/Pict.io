const rawWords = require('./words.json');

// Super easy words guaranteed to be drawn easily
const easyWords = [
    "apple", "banana", "cat", "dog", "elephant", "fish", "guitar", "house", "kite", "lion", 
    "monkey", "ninja", "octopus", "penguin", "queen", "robot", "snake", "tree", "unicorn", 
    "vampire", "watermelon", "yoyo", "zebra", "airplane", "boat", "car", "door", "eye", "fire", 
    "ghost", "hat", "island", "jacket", "key", "lamp", "moon", "nose", "ocean", "pizza", "quilt", 
    "rain", "sun", "train", "umbrella", "volcano", "window", "yacht", "zoo", "mountain", "river", 
    "bridge", "castle", "dragon", "knight", "sword", "shield", "forest", "desert", "alien", 
    "spaceship", "planet", "star", "telescope", "microscope", "computer", "phone", "bird", "cloud",
    "cup", "bed", "chair", "table", "clock", "shoe", "socks", "shirt", "pants", "glasses"
];

// The rest of the dictionary
const normalWords = rawWords.filter(word => {
    return word.length >= 3 && 
           word.length <= 10 && 
           /^[a-z]+$/.test(word) &&
           !easyWords.includes(word);
});

function getRandomWords(count = 3, customWords = [], useCustomOnly = false) {
    if (useCustomOnly && customWords.length >= count) {
        const shuffled = [...new Set(customWords)].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    let poolEasy = [...easyWords].sort(() => 0.5 - Math.random());
    let poolNormal = [...normalWords].sort(() => 0.5 - Math.random());
    let poolCustom = [...customWords].sort(() => 0.5 - Math.random());
    
    let choices = [];
    
    // 1. Always one easy word
    choices.push(poolEasy.pop());
    
    // 2. If custom words exist, add one custom word
    if (poolCustom.length > 0) {
        choices.push(poolCustom.pop());
    } else {
        choices.push(poolNormal.pop());
    }
    
    // 3. One normal word
    choices.push(poolNormal.pop());
    
    // 4. Fill remaining if count > 3
    while (choices.length < count) {
        choices.push(poolNormal.pop());
    }
    
    // Shuffle the final choices so the easy one isn't always first
    return choices.sort(() => 0.5 - Math.random());
}

module.exports = {
    words: rawWords,
    getRandomWords
};
