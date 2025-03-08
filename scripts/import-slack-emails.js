#!/usr/bin/env node

/**
 * Slack Email Extractor
 * 
 * This script helps extract email addresses from Slack data.
 * You can either:
 * 1. Paste Slack data into a text file and provide the file path
 * 2. Paste Slack data directly when prompted
 * 
 * Usage:
 *   node import-slack-emails.js [input-file] [output-file]
 * 
 * Example:
 *   node import-slack-emails.js slack-data.txt gauntlet-emails.csv
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Email regex pattern
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get input and output file paths from command line arguments
const inputFile = process.argv[2];
const outputFile = process.argv[3] || 'gauntlet-emails.csv';

/**
 * Extract emails from text
 * @param {string} text - Text to extract emails from
 * @returns {string[]} - Array of extracted emails
 */
function extractEmails(text) {
  return text.match(EMAIL_REGEX) || [];
}

/**
 * Filter emails to only include Gauntlet emails
 * @param {string[]} emails - Array of emails
 * @returns {string[]} - Array of Gauntlet emails
 */
function filterGauntletEmails(emails) {
  return emails.filter(email => 
    email.toLowerCase().endsWith('@gauntletai.com') || 
    email.toLowerCase().includes('gauntlet')
  );
}

/**
 * Convert emails to CSV format
 * @param {string[]} emails - Array of emails
 * @returns {string} - CSV content
 */
function convertToCSV(emails) {
  const header = 'Email,ForwardingEmail,Status\n';
  const rows = emails.map(email => `${email},,INACTIVE`).join('\n');
  return header + rows;
}

/**
 * Process text input and save results
 * @param {string} text - Input text
 */
function processInput(text) {
  // Extract all emails
  const allEmails = extractEmails(text);
  console.log(`Found ${allEmails.length} email addresses.`);
  
  // Filter to only Gauntlet emails
  const gauntletEmails = filterGauntletEmails(allEmails);
  console.log(`Found ${gauntletEmails.length} Gauntlet email addresses.`);
  
  if (gauntletEmails.length === 0) {
    console.log('No Gauntlet emails found. Exiting.');
    rl.close();
    return;
  }
  
  // Convert to CSV
  const csvContent = convertToCSV(gauntletEmails);
  
  // Save to file
  fs.writeFileSync(outputFile, csvContent);
  console.log(`Saved ${gauntletEmails.length} emails to ${outputFile}`);
  
  // Also output the emails for easy copying
  console.log('\nGauntlet Emails (for copying to import dialog):');
  console.log(gauntletEmails.join('\n'));
  
  rl.close();
}

// Main execution
if (inputFile) {
  // Read from file
  try {
    const text = fs.readFileSync(inputFile, 'utf8');
    processInput(text);
  } catch (error) {
    console.error(`Error reading file: ${error.message}`);
    rl.close();
  }
} else {
  // Read from stdin
  console.log('Paste Slack data (press Ctrl+D when finished):');
  let input = '';
  
  rl.on('line', (line) => {
    input += line + '\n';
  });
  
  rl.on('close', () => {
    processInput(input);
  });
} 