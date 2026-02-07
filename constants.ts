import { File } from './types';

export const INITIAL_FILES: File[] = [
  {
    id: '1',
    name: 'main.py',
    language: 'python',
    content: `def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
        
    return sequence

if __name__ == "__main__":
    result = fibonacci(10)
    print(f"First 10 Fibonacci numbers: {result}")
`
  },
  {
    id: '2',
    name: 'utils.js',
    language: 'javascript',
    content: `export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};`
  },
  {
    id: '3',
    name: 'readme.md',
    language: 'markdown',
    content: `# Project Documentation

This is a sample project managed by DevMate AI.

## Features
- Fibonacci sequence generator
- Date formatting utilities
- String manipulation helpers

## Usage
Run the python script to see the sequence.`
  }
];

export const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  html: 'html',
  css: 'css',
  json: 'json',
  md: 'markdown',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  go: 'go',
  rs: 'rust'
};