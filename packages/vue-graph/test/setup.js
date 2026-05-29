import { vi } from "vitest"

const createElement = global.document.createElement;
const FAKECanvasElement = {
    getContext: vi.fn(() => {
        return {
            fillStyle: null,
            fillRect: vi.fn(),
            drawImage: vi.fn(),
            getImageData: vi.fn(),
        };
    }),
};

/**
 * Using Sinon to stub the createElement function call with the original method
 * unless we match the 'canvas' argument.  If that's the case, return the Fake
 * Canvas object.
 */
global.document.createElement = vi.fn((tagName, options) => {
    if (tagName === "canvas") {
        return FAKECanvasElement
    }

    return createElement.call(global.document, tagName, options)
})
