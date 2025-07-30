const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const {
  parseArgs,
  loadCommand,
  prepareTempFile,
  buildClaudeArgs,
  main
} = require('../lib');

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');

describe('claude-batch CLI', () => {
  let mockSpawn;
  let mockProcess;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fs methods
    fs.existsSync = jest.fn();
    fs.readFileSync = jest.fn();
    fs.writeFileSync = jest.fn();
    fs.mkdirSync = jest.fn();

    // Mock child_process.spawn
    mockProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn()
    };
    mockSpawn = jest.fn().mockReturnValue(mockProcess);
    require('child_process').spawn = mockSpawn;

    // Mock console methods
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('parseArgs', () => {
    test('should parse basic arguments', () => {
      const result = parseArgs(['/test', 'arg1']);
      expect(result).toEqual({
        debug: false,
        model: null,
        print: false,
        hook: null,
        commandName: 'test',
        commandArg: 'arg1'
      });
    });

    test('should parse flags correctly', () => {
      const result = parseArgs(['-p', '--debug', '--model', 'sonnet', '/test']);
      expect(result).toEqual({
        debug: true,
        model: 'sonnet',
        print: true,
        hook: null,
        commandName: 'test',
        commandArg: null
      });
    });

    test('should parse hook argument', () => {
      const result = parseArgs(['/test', '--hook', './script.sh']);
      expect(result.hook).toBe('./script.sh');
    });

    test('should throw error for unknown argument', () => {
      expect(() => parseArgs(['unknown'])).toThrow('Unknown argument: unknown');
    });
  });

  describe('loadCommand', () => {
    test('should load command file successfully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('Test prompt #$ARGUMENTS');
      
      const result = loadCommand('test', 'arg1', '/mock/home');
      
      expect(fs.existsSync).toHaveBeenCalledWith('/mock/home/.claude/commands/test.md');
      expect(fs.readFileSync).toHaveBeenCalledWith('/mock/home/.claude/commands/test.md', 'utf8');
      expect(result).toBe('Test prompt arg1');
    });

    test('should throw error if command file not found', () => {
      fs.existsSync.mockReturnValue(false);
      
      expect(() => loadCommand('test', null, '/mock/home'))
        .toThrow('Command file not found: /mock/home/.claude/commands/test.md');
    });

    test('should not replace arguments if none provided', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('Test prompt #$ARGUMENTS');
      
      const result = loadCommand('test', null, '/mock/home');
      expect(result).toBe('Test prompt #$ARGUMENTS');
    });
  });

  describe('prepareTempFile', () => {
    test('should create temp directory and return file path', () => {
      const mockDate = 1234567890;
      jest.spyOn(Date, 'now').mockReturnValue(mockDate);
      
      const result = prepareTempFile('/mock/home');
      
      expect(fs.mkdirSync).toHaveBeenCalledWith('/mock/home/.claude-batch/tmp', { recursive: true });
      expect(result).toBe('/mock/home/.claude-batch/tmp/out_1234567890.txt');
      
      Date.now.mockRestore();
    });
  });

  describe('buildClaudeArgs', () => {
    test('should build claude arguments correctly', () => {
      const options = {
        print: true,
        debug: true,
        model: 'sonnet'
      };
      const prompt = 'test prompt';
      
      const result = buildClaudeArgs(options, prompt);
      
      expect(result).toEqual(['-p', '--debug', '--model', 'sonnet', 'test prompt']);
    });

    test('should build minimal arguments', () => {
      const options = {
        print: false,
        debug: false,
        model: null
      };
      const prompt = 'test prompt';
      
      const result = buildClaudeArgs(options, prompt);
      
      expect(result).toEqual(['test prompt']);
    });
  });

  describe('main', () => {
    test('should return error code 1 for missing command', async () => {
      const result = await main([]);
      
      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith('No command specified (e.g. /foo)');
    });

    test('should return error code 1 for missing command file', async () => {
      fs.existsSync.mockReturnValue(false);
      
      const result = await main(['/nonexistent']);
      
      expect(result).toBe(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Command file not found')
      );
    });
  });
});