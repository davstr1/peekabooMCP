export enum PeekabooErrorCode {
  // Security errors (1xxx)
  PATH_TRAVERSAL = 1001,
  UNAUTHORIZED_ACCESS = 1002,
  NOT_IN_NODE_MODULES = 1003,
  
  // File system errors (2xxx)
  FILE_NOT_FOUND = 2001,
  DIRECTORY_NOT_FOUND = 2002,
  NOT_A_DIRECTORY = 2003,
  NOT_A_FILE = 2004,
  PERMISSION_DENIED = 2005,
  
  // Resource limit errors (3xxx)
  FILE_TOO_LARGE = 3001,
  TOTAL_SIZE_EXCEEDED = 3002,
  OPERATION_TIMEOUT = 3003,
  
  // Protocol errors (4xxx)
  INVALID_URI = 4001,
  UNKNOWN_TOOL = 4002,
  MISSING_PARAMETER = 4003,
  INVALID_PARAMETER = 4004,
  
  // Internal errors (5xxx)
  INTERNAL_ERROR = 5000
}

export function getErrorMessage(code: PeekabooErrorCode): string {
  const messages: Record<PeekabooErrorCode, string> = {
    [PeekabooErrorCode.PATH_TRAVERSAL]: 'Path traversal detected: Access outside root directory is not allowed',
    [PeekabooErrorCode.UNAUTHORIZED_ACCESS]: 'Unauthorized access attempt',
    [PeekabooErrorCode.NOT_IN_NODE_MODULES]: 'peekaboo-mcp must be run as an installed npm package',
    
    [PeekabooErrorCode.FILE_NOT_FOUND]: 'File not found',
    [PeekabooErrorCode.DIRECTORY_NOT_FOUND]: 'Directory not found',
    [PeekabooErrorCode.NOT_A_DIRECTORY]: 'Path is not a directory',
    [PeekabooErrorCode.NOT_A_FILE]: 'Path is not a file',
    [PeekabooErrorCode.PERMISSION_DENIED]: 'Permission denied',
    
    [PeekabooErrorCode.FILE_TOO_LARGE]: 'File size exceeds maximum allowed size',
    [PeekabooErrorCode.TOTAL_SIZE_EXCEEDED]: 'Total size exceeds maximum allowed size',
    [PeekabooErrorCode.OPERATION_TIMEOUT]: 'Operation timed out',
    
    [PeekabooErrorCode.INVALID_URI]: 'Invalid URI format',
    [PeekabooErrorCode.UNKNOWN_TOOL]: 'Unknown tool',
    [PeekabooErrorCode.MISSING_PARAMETER]: 'Required parameter missing',
    [PeekabooErrorCode.INVALID_PARAMETER]: 'Invalid parameter value',
    
    [PeekabooErrorCode.INTERNAL_ERROR]: 'Internal server error'
  };
  
  return messages[code] || 'Unknown error';
}