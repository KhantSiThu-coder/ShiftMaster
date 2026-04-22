
import React from 'react';

/**
 * Regex to match URLs.
 */
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Takes a string and returns an array of React elements where URLs are replaced with <a> tags.
 * @param text The text to format
 * @param isStacked If true, each link will be wrapped in a div to ensure it's on a new line
 */
export const formatLinks = (text: string, isStacked: boolean = false) => {
  if (!text) return null;
  
  const parts = text.split(URL_REGEX);
  
  return parts.map((part, i) => {
    if (part.match(URL_REGEX)) {
      const link = (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
      
      return isStacked ? <div key={`stacked-${i}`} className="my-1">{link}</div> : link;
    }
    return part;
  });
};
