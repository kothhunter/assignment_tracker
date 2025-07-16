# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024 Projected Journal

"""
Logging utilities for the Projected Journal package.

This module provides standardized logging functionality across all components.
"""

import logging
import sys
from typing import Optional


def get_logger(name: str, level: Optional[str] = None) -> logging.Logger:
    """
    Get a configured logger instance.
    
    Args:
        name: Logger name (typically __name__)
        level: Optional log level override ("DEBUG", "INFO", "WARNING", "ERROR")
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Only configure if no handlers exist (avoid duplicate handlers)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stderr)
        formatter = logging.Formatter(
            fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    # Set level if provided
    if level:
        numeric_level = getattr(logging, level.upper(), logging.WARNING)
        logger.setLevel(numeric_level)
    elif logger.level == logging.NOTSET:
        # Default to WARNING if no level set
        logger.setLevel(logging.WARNING)
    
    return logger 