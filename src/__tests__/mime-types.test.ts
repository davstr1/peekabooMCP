import { describe, test, expect } from 'vitest';
import { getMimeType } from '../mime-types.js';

describe('getMimeType', () => {
  test('returns correct MIME for .js files', () => {
    expect(getMimeType('script.js')).toBe('application/javascript');
    expect(getMimeType('main.js')).toBe('application/javascript');
    expect(getMimeType('/path/to/file.js')).toBe('application/javascript');
  });

  test('returns correct MIME for .json files', () => {
    expect(getMimeType('data.json')).toBe('application/json');
    expect(getMimeType('package.json')).toBe('application/json');
  });

  test('returns correct MIME for .md files', () => {
    expect(getMimeType('README.md')).toBe('text/markdown');
    expect(getMimeType('docs.md')).toBe('text/markdown');
  });

  test('returns correct MIME for image files', () => {
    expect(getMimeType('photo.jpg')).toBe('image/jpeg');
    expect(getMimeType('photo.jpeg')).toBe('image/jpeg');
    expect(getMimeType('icon.png')).toBe('image/png');
    expect(getMimeType('animation.gif')).toBe('image/gif');
    expect(getMimeType('logo.svg')).toBe('image/svg+xml');
    expect(getMimeType('modern.webp')).toBe('image/webp');
  });

  test('returns correct MIME for TypeScript files', () => {
    expect(getMimeType('component.ts')).toBe('application/typescript');
    expect(getMimeType('component.tsx')).toBe('application/typescript');
  });

  test('returns correct MIME for various code files', () => {
    expect(getMimeType('script.py')).toBe('text/x-python');
    expect(getMimeType('Main.java')).toBe('text/x-java');
    expect(getMimeType('program.c')).toBe('text/x-c');
    expect(getMimeType('app.cpp')).toBe('text/x-c++');
    expect(getMimeType('lib.rs')).toBe('text/x-rust');
    expect(getMimeType('main.go')).toBe('text/x-go');
    expect(getMimeType('app.rb')).toBe('text/x-ruby');
    expect(getMimeType('index.php')).toBe('text/x-php');
  });

  test('returns correct MIME for shell scripts', () => {
    expect(getMimeType('setup.sh')).toBe('text/x-sh');
    expect(getMimeType('install.bash')).toBe('text/x-sh');
    expect(getMimeType('config.zsh')).toBe('text/x-sh');
  });

  test('returns correct MIME for config files', () => {
    expect(getMimeType('config.yaml')).toBe('text/yaml');
    expect(getMimeType('docker-compose.yml')).toBe('text/yaml');
    expect(getMimeType('Cargo.toml')).toBe('text/toml');
    expect(getMimeType('data.xml')).toBe('text/xml');
  });

  test('returns correct MIME for document files', () => {
    expect(getMimeType('document.pdf')).toBe('application/pdf');
    expect(getMimeType('report.doc')).toBe('application/msword');
    expect(getMimeType('report.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });

  test('returns correct MIME for archive files', () => {
    expect(getMimeType('backup.zip')).toBe('application/zip');
    expect(getMimeType('archive.tar')).toBe('application/x-tar');
    expect(getMimeType('compressed.gz')).toBe('application/gzip');
  });

  test('returns text/plain for unknown extensions', () => {
    expect(getMimeType('unknown.xyz')).toBe('text/plain');
    expect(getMimeType('custom.abc123')).toBe('text/plain');
    expect(getMimeType('weird.!!!!')).toBe('text/plain');
  });

  test('handles files without extensions', () => {
    expect(getMimeType('README')).toBe('text/plain');
    expect(getMimeType('Makefile')).toBe('text/plain');
    expect(getMimeType('LICENSE')).toBe('text/plain');
    expect(getMimeType('.gitignore')).toBe('text/plain');
  });

  test('case insensitive extension matching', () => {
    expect(getMimeType('script.JS')).toBe('application/javascript');
    expect(getMimeType('IMAGE.PNG')).toBe('image/png');
    expect(getMimeType('Document.PDF')).toBe('application/pdf');
    expect(getMimeType('ARCHIVE.ZIP')).toBe('application/zip');
    expect(getMimeType('MiXeD.JsOn')).toBe('application/json');
  });

  test('handles multiple dots in filename', () => {
    expect(getMimeType('my.component.test.js')).toBe('application/javascript');
    expect(getMimeType('package.lock.json')).toBe('application/json');
    expect(getMimeType('v1.2.3.tar.gz')).toBe('application/gzip');
    expect(getMimeType('backup.2024.12.25.zip')).toBe('application/zip');
  });

  test('handles paths with directories', () => {
    expect(getMimeType('/home/user/documents/file.pdf')).toBe('application/pdf');
    expect(getMimeType('C:\\Users\\Documents\\report.docx')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(getMimeType('../../../images/photo.jpg')).toBe('image/jpeg');
    expect(getMimeType('./src/components/Button.tsx')).toBe('application/typescript');
  });

  test('handles edge cases', () => {
    expect(getMimeType('')).toBe('text/plain');
    expect(getMimeType('.')).toBe('text/plain');
    expect(getMimeType('..')).toBe('text/plain');
    expect(getMimeType('...')).toBe('text/plain');
    expect(getMimeType('file.')).toBe('text/plain'); // Ends with dot
    expect(getMimeType('.hidden')).toBe('text/plain'); // Hidden file
  });

  test('common web development files', () => {
    expect(getMimeType('index.html')).toBe('text/html');
    expect(getMimeType('styles.css')).toBe('text/css');
    expect(getMimeType('data.csv')).toBe('text/csv');
    expect(getMimeType('App.jsx')).toBe('text/jsx');
    expect(getMimeType('module.mjs')).toBe('application/javascript');
  });

  test('config and env files', () => {
    expect(getMimeType('.env')).toBe('text/plain');
    expect(getMimeType('config.ini')).toBe('text/plain');
    expect(getMimeType('app.conf')).toBe('text/plain');
    expect(getMimeType('nginx.config')).toBe('text/plain');
    expect(getMimeType('error.log')).toBe('text/plain');
  });
});