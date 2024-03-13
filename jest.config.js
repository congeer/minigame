/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    "verbose": true,
    transform: {
        '^.+\\.ts?$': 'ts-jest', //typescript转换
        '^.+\\.(js|jsx)$': 'babel-jest',
    },
    "transformIgnorePatterns": [
        "node_modules/(?!(nanoid)/)",
    ],
};
