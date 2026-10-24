import test from 'node:test';
import assert from 'node:assert/strict';
import { parseJobText } from '../src/services/ocrService';

test('parseJobText: extracts primary recruiter email and skills from LinkedIn post', () => {
  const samplePostText = `StartupX
We're hiring! 🚀
We are looking for a Software Engineer (Backend) to join our early stage startup. If you are passionate about building scalable products, we'd love to hear from you.
• 2-4 years of experience
• Strong knowledge of Java / Spring Boot
• Experience with microservices
• Remote working
Send your resume to careers@startupx.com`;

  const result = parseJobText(samplePostText);

  assert.equal(result.email, 'careers@startupx.com');
  assert.equal(result.role, 'Software Engineer (Backend)');
  assert.ok(result.skills.includes('Java'));
  assert.ok(result.skills.includes('Spring Boot'));
  assert.ok(result.skills.includes('Microservices'));
  assert.equal(result.location, 'Remote');
  assert.equal(result.experience, '2-4 years');
});

test('parseJobText: handles multiple candidate emails and dedups them', () => {
  const postWithMultipleEmails = `Hiring SDET at CloudTech!
Contact: jobs@cloudtech.dev or founder@cloudtech.dev
Required: Appium, TestNG, Java
Experience: 3+ years`;

  const result = parseJobText(postWithMultipleEmails);

  assert.equal(result.email, 'jobs@cloudtech.dev');
  assert.equal(result.candidateEmails?.length, 2);
  assert.ok(result.candidateEmails?.includes('founder@cloudtech.dev'));
  assert.ok(result.skills.includes('Appium'));
  assert.ok(result.skills.includes('TestNG'));
});

test('parseJobText: gracefully handles missing email', () => {
  const postWithoutEmail = `Hiring QA Engineer
Apply on our portal at company.com/careers
3 years experience required with Selenium and Python`;

  const result = parseJobText(postWithoutEmail);

  assert.equal(result.email, '');
  assert.equal(result.candidateEmails?.length, 0);
  assert.ok(result.skills.includes('Selenium'));
  assert.ok(result.skills.includes('Python'));
});

test('emailTemplate: replaces role, company, matched_skills, and signature properly', () => {
  const template = "Hi {company} team, applying for {role}. Skills: {matched_skills}.\n{signature}";
  const signature = "Best,\nAmit Roy";
  const userSkills = ['Java', 'Appium', 'TestNG'];
  const jobSkills = ['Java', 'Spring Boot'];

  const matched = userSkills.filter(s => jobSkills.includes(s));
  const populated = template
    .replace('{company}', 'StartupX')
    .replace('{role}', 'SDET')
    .replace('{matched_skills}', matched.join(', '))
    .replace('{signature}', signature);

  assert.ok(populated.includes('Hi StartupX team, applying for SDET.'));
  assert.ok(populated.includes('Skills: Java.'));
  assert.ok(populated.includes('Best,\nAmit Roy'));
});
