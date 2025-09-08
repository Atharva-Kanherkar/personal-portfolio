 "use client";
import { useState, useEffect, useRef } from "react";
import { Column, Row, Text } from "@once-ui-system/core";

interface TerminalProps {
  className?: string;
}

interface HistoryEntry {
  type: 'input' | 'output' | 'prompt';
  content: string;
  timestamp?: Date;
}

export const Terminal: React.FC<TerminalProps> = ({ className }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: 'output', content: 'Ubuntu 22.04.3 LTS \\n \\l' },
    { type: 'output', content: '' },
    { type: 'output', content: 'Last login: ' + new Date().toLocaleString() + ' from 192.168.1.100' },
    { type: 'output', content: 'Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-72-generic x86_64)' },
    { type: 'output', content: '' },
    { type: 'output', content: ' * Documentation:  https://help.ubuntu.com' },
    { type: 'output', content: ' * Management:     https://landscape.canonical.com' },
    { type: 'output', content: ' * Support:        https://ubuntu.com/advantage' },
    { type: 'output', content: '' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentDir, setCurrentDir] = useState('/home/atharva');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // File system simulation
  const fileSystem = {
    '/home/atharva': {
      type: 'dir',
      children: ['projects', 'documents', 'downloads', '.bashrc', '.profile', 'readme.md', 'resume.pdf']
    },
    '/home/atharva/projects': {
      type: 'dir', 
      children: ['rimo-workflows', 'zowe-lfx', 'palisadoes-oss', 'workflows4s-gsoc']
    },
    '/home/atharva/documents': {
      type: 'dir',
      children: ['certificates', 'presentations']
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isProcessing) return;

    switch (e.key) {
      case 'Enter':
        executeCommand(currentInput.trim());
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setCurrentInput('');
        }
        break;
      case 'Tab':
        e.preventDefault();
        autoComplete();
        break;
      case 'l':
        if (e.ctrlKey) {
          e.preventDefault();
          clearTerminal();
        }
        break;
      case 'c':
        if (e.ctrlKey) {
          e.preventDefault();
          setCurrentInput('');
          addToHistory({ type: 'output', content: '^C' });
          setIsProcessing(false);
        }
        break;
    }
  };

  const autoComplete = () => {
    const commands = ['help', 'ls', 'cd', 'pwd', 'cat', 'clear', 'whoami', 'uname', 'date', 'history', 'skills', 'projects', 'experience', 'contact'];
    const matches = commands.filter(cmd => cmd.startsWith(currentInput));
    if (matches.length === 1) {
      setCurrentInput(matches[0]);
    } else if (matches.length > 1) {
      addToHistory({ type: 'output', content: matches.join('  ') });
    }
  };

  const addToHistory = (entry: HistoryEntry) => {
    setHistory(prev => [...prev, entry]);
  };

  const getPrompt = () => {
    const shortDir = currentDir.replace('/home/atharva', '~');
    return `atharva@portfolio-server:${shortDir}$`;
  };

  const clearTerminal = () => {
    setHistory([]);
  };

  const executeCommand = (command: string) => {
    if (!command) {
      addToHistory({ type: 'prompt', content: getPrompt() });
      setCurrentInput('');
      return;
    }

    setIsProcessing(true);
    addToHistory({ type: 'input', content: `${getPrompt()} ${command}` });
    
    // Add to command history
    setCommandHistory(prev => [command, ...prev].slice(0, 100));
    setHistoryIndex(-1);
    setCurrentInput('');

    setTimeout(() => {
      const args = command.split(' ');
      const cmd = args[0].toLowerCase();
      let output = '';

      switch (cmd) {
        case 'help':
          output = `GNU bash, version 5.1.16(1)-release (x86_64-pc-linux-gnu)
These shell commands are defined internally. Type 'help' to see this list.

Portfolio Commands:
  skills          show technical skills
  projects        list current projects  
  experience      show work experience
  contact         display contact information

Standard Commands:
  ls [dir]        list directory contents
  cd [dir]        change directory
  pwd             print working directory
  cat [file]      display file contents
  clear           clear terminal screen
  whoami          display current user
  uname [-a]      system information
  date            display current date
  history         command history
  
Use Ctrl+L to clear screen, Ctrl+C to cancel, Tab for autocomplete`;
          break;

        case 'ls':
          const targetDir = args[1] ? (args[1].startsWith('/') ? args[1] : `${currentDir}/${args[1]}`) : currentDir;
          const fsEntry = fileSystem[targetDir as keyof typeof fileSystem];
          if (fsEntry && fsEntry.type === 'dir') {
            output = fsEntry.children.join('  ');
          } else {
            output = `ls: cannot access '${args[1] || targetDir}': No such file or directory`;
          }
          break;

        case 'cd':
          if (!args[1] || args[1] === '~') {
            setCurrentDir('/home/atharva');
            output = '';
          } else if (args[1] === '..') {
            const parentDir = currentDir.split('/').slice(0, -1).join('/') || '/';
            setCurrentDir(parentDir);
            output = '';
          } else {
            const newDir = args[1].startsWith('/') ? args[1] : `${currentDir}/${args[1]}`;
            if (fileSystem[newDir as keyof typeof fileSystem]) {
              setCurrentDir(newDir);
              output = '';
            } else {
              output = `bash: cd: ${args[1]}: No such file or directory`;
            }
          }
          break;

        case 'pwd':
          output = currentDir;
          break;

        case 'cat':
          if (!args[1]) {
            output = 'cat: missing file operand';
          } else if (args[1] === 'readme.md') {
            output = `# Atharva Kanherkar - Software Engineer

## About
Backend-focused fullstack developer specializing in distributed systems,
open source contributions, and cloud-native technologies.

## Current Work
- Workflow systems at Rimo LLC, Tokyo
- Zowe improvements via Linux Foundation  
- Open source maintenance at Palisadoes Foundation
- Google Summer of Code - Workflows4s project
- Typelevel open source contributions

## Technical Focus
- Distributed systems architecture
- Cloud-native development (AWS, GCP)
- Backend engineering (Go, Scala, Node.js)
- Open source development and maintenance`;
          } else if (args[1] === '.bashrc') {
            output = `# ~/.bashrc: executed by bash(1) for non-login shells.

# Portfolio aliases
alias skills='echo "Backend: Go, Node.js, Scala | Frontend: TypeScript, React | Cloud: AWS, GCP, Docker"'
alias projects='echo "Rimo LLC | Linux Foundation | Palisadoes | GSoC | Typelevel"'

# Standard aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'`;
          } else {
            output = `cat: ${args[1]}: No such file or directory`;
          }
          break;

        case 'whoami':
          output = 'atharva';
          break;

        case 'uname':
          if (args[1] === '-a') {
            output = 'Linux portfolio-server 5.15.0-72-generic #79-Ubuntu SMP Wed Apr 19 08:22:18 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux';
          } else {
            output = 'Linux';
          }
          break;

        case 'date':
          output = new Date().toString();
          break;

        case 'clear':
          clearTerminal();
          setIsProcessing(false);
          return;

        case 'history':
          output = commandHistory.slice(0, 10).map((cmd, i) => `  ${commandHistory.length - i}  ${cmd}`).join('\n');
          break;

        case 'skills':
          output = `Technical Skills:
==================================================
Backend Development:
  • Languages: Go, Node.js, Scala, C++
  • Frameworks: Express.js, Echo, Gin, Akka

Frontend & Fullstack:
  • Languages: TypeScript, JavaScript  
  • Frameworks: Next.js, React, Vue.js

Cloud & DevOps:
  • Platforms: AWS, Google Cloud Platform
  • Tools: Docker, Kubernetes, Jenkins, GitHub Actions
  • Infrastructure: Terraform, CloudFormation

Databases:
  • SQL: PostgreSQL, MySQL
  • NoSQL: MongoDB, Redis, DynamoDB

Open Source:
  • Maintainer at Palisadoes Foundation
  • Contributor to Typelevel ecosystem
  • GSoC Developer for Workflows4s`;
          break;

        case 'projects':
          output = `Current Active Projects:
==================================================
[INTERN] Rimo LLC, Tokyo
└── Software Engineering Intern
    └── Building workflow automation systems
    
[MENTORSHIP] Linux Foundation - LFX Program  
└── Zowe CLI Enhancement Project
    └── Improving mainframe development tools

[MAINTAINER] Palisadoes Foundation
└── Open Source Project Maintenance
    └── Community management & code reviews

[GSoC] Workflows4s - Google Summer of Code
└── Scala workflow engine development
    └── Functional programming patterns

[CONTRIBUTOR] Typelevel Organization
└── Open source Scala ecosystem
    └── Library improvements & documentation`;
          break;

        case 'experience':
          output = `Professional Experience:
==================================================
2025-Present   Software Engineering Intern
               Rimo LLC, Tokyo, Japan
               • Workflow automation systems
               • Distributed system architecture

2025-Present   LFX Mentorship Developer  
               Linux Foundation
               • Zowe CLI enhancements
               • Mainframe modernization tools

2024-Present   Open Source Maintainer
               Palisadoes Foundation
               • Project maintenance & community management
               • Code review & contributor mentoring

2025           Google Summer of Code Developer
               Workflows4s Project
               • Scala-based workflow engine
               • Functional programming implementation

2025-Present   Open Source Contributor
               Typelevel Organization
               • Scala ecosystem contributions
               • Documentation & library improvements`;
          break;

        case 'contact':
          output = `Contact Information:
==================================================
📧 Email:     atharvakanherkar25@gmail.com
🐙 GitHub:    https://github.com/Atharva-Kanherkar  
💼 LinkedIn:  https://linkedin.com/in/atharva-kanherkar-4370a3257
🌍 Location:  Asia/Kolkata, India
⏰ Timezone:  UTC+05:30

Available for:
• Backend engineering opportunities
• Open source collaborations  
• Technical mentoring & discussions
• Distributed systems consulting`;
          break;

        default:
          output = `bash: ${command}: command not found`;
      }

      if (output) {
        addToHistory({ type: 'output', content: output });
      }
      setIsProcessing(false);
    }, 100 + Math.random() * 200); // Simulate processing time
  };

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  return (
    <Column className={className} fillWidth>
      <Column 
        ref={terminalRef}
        style={{ 
          backgroundColor: "#0c0c0c",
          border: "1px solid #404040",
          borderRadius: "6px",
          padding: "16px",
          fontFamily: "'Ubuntu Mono', 'Courier New', monospace",
          minHeight: "500px",
          maxHeight: "700px", 
          overflowY: "auto",
          cursor: "text",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
          fontSize: "14px",
          lineHeight: "1.2"
        }}
        onClick={handleTerminalClick}
      >
        {/* Terminal Content */}
        <Column gap="0">
          {history.map((entry, index) => (
            <div key={index} style={{
              color: entry.type === 'input' ? "#00ff00" : "#ffffff",
              fontFamily: "'Ubuntu Mono', 'Courier New', monospace",
              fontSize: "14px",
              lineHeight: "1.2",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              marginBottom: "2px"
            }}>
              {entry.content}
            </div>
          ))}
          
          {/* Current Input Line */}
          {!isProcessing && (
            <div style={{ 
              display: "flex", 
              alignItems: "center",
              marginTop: "4px" 
            }}>
              <span style={{
                color: "#00ff00", 
                fontFamily: "'Ubuntu Mono', 'Courier New', monospace",
                fontSize: "14px",
                marginRight: "8px"
              }}>
                {getPrompt()}
              </span>
              <input
                ref={inputRef}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#ffffff",
                  fontFamily: "'Ubuntu Mono', 'Courier New', monospace", 
                  fontSize: "14px",
                  width: "100%",
                  lineHeight: "1.2",
                  caretColor: "#00ff00"
                }}
                autoFocus
                spellCheck={false}
              />
            </div>
          )}
          
          {/* Processing indicator */}
          {isProcessing && (
            <div style={{
              color: "#ffffff",
              fontFamily: "'Ubuntu Mono', 'Courier New', monospace",
              fontSize: "14px",
              marginTop: "4px"
            }}>
              Processing...
            </div>
          )}
        </Column>
      </Column>
    </Column>
  );
};