import { ApiSnapshot } from './api-client';

export interface SequenceStep {
  actor: string;
  action: string;
  target: string;
  data?: unknown;
  timestamp: number;
  duration?: number;
  status?: number;
}

export class SequenceGenerator {
  static generateFromSnapshots(snapshots: ApiSnapshot[]): string {
    if (snapshots.length === 0) {
      return 'sequenceDiagram\n    Note over Client,Server: No API calls recorded';
    }

    // Sort snapshots by timestamp
    const sortedSnapshots = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
    
    let mermaid = 'sequenceDiagram\n';
    
    // Add participants
    const participants = new Set<string>();
    sortedSnapshots.forEach(snapshot => {
      const url = new URL(snapshot.request.url);
      const hostname = url.hostname;
      participants.add('Client');
      participants.add(hostname);
    });
    
    participants.forEach(participant => {
      mermaid += `    participant ${participant}\n`;
    });
    
    // Add sequence steps
    sortedSnapshots.forEach((snapshot, index) => {
      const url = new URL(snapshot.request.url);
      const hostname = url.hostname;
      const method = snapshot.request.method;
      const path = url.pathname;
      const status = snapshot.response.status;
      
      // Request
      mermaid += `    Client->>${hostname}: ${method} ${path}\n`;
      
      // Add request body if present
      if (snapshot.request.body) {
        try {
          const body = JSON.parse(snapshot.request.body);
          const bodyStr = JSON.stringify(body).substring(0, 50);
          mermaid += `    Note over Client,${hostname}: ${bodyStr}${bodyStr.length >= 50 ? '...' : ''}\n`;
        } catch {
          // Not JSON, show as text
          const bodyStr = snapshot.request.body.substring(0, 50);
          mermaid += `    Note over Client,${hostname}: ${bodyStr}${bodyStr.length >= 50 ? '...' : ''}\n`;
        }
      }
      
      // Response
      // Status color for potential future use
      // const statusColor = status >= 200 && status < 300 ? 'green' : 
      //                    status >= 400 ? 'red' : 'yellow';
      mermaid += `    ${hostname}-->>Client: ${status} (${snapshot.response.duration}ms)\n`;
      
      // Add response data if small enough
      if (snapshot.response.data && typeof snapshot.response.data === 'object') {
        const responseStr = JSON.stringify(snapshot.response.data).substring(0, 100);
        if (responseStr.length < 100) {
          mermaid += `    Note over ${hostname},Client: ${responseStr}\n`;
        }
      }
      
      // Add delay between requests if there's a gap
      if (index < sortedSnapshots.length - 1) {
        const nextSnapshot = sortedSnapshots[index + 1];
        const timeDiff = nextSnapshot.timestamp - snapshot.timestamp;
        if (timeDiff > 1000) { // More than 1 second
          mermaid += `    Note over Client,${hostname}: Wait ${Math.round(timeDiff / 1000)}s\n`;
        }
      }
    });
    
    return mermaid;
  }
  
  static generateFromSteps(steps: SequenceStep[]): string {
    if (steps.length === 0) {
      return 'sequenceDiagram\n    Note over Client,Server: No steps recorded';
    }

    let mermaid = 'sequenceDiagram\n';
    
    // Add participants
    const participants = new Set<string>();
    steps.forEach(step => {
      participants.add(step.actor);
      participants.add(step.target);
    });
    
    participants.forEach(participant => {
      mermaid += `    participant ${participant}\n`;
    });
    
    // Add sequence steps
    steps.forEach((step) => {
      const status = step.status ? ` (${step.status})` : '';
      const duration = step.duration ? ` [${step.duration}ms]` : '';
      
      mermaid += `    ${step.actor}->>${step.target}: ${step.action}${status}${duration}\n`;
      
      // Add data note if present
      if (step.data) {
        const dataStr = typeof step.data === 'string' ? step.data : JSON.stringify(step.data);
        const truncated = dataStr.substring(0, 50);
        mermaid += `    Note over ${step.actor},${step.target}: ${truncated}${truncated.length >= 50 ? '...' : ''}\n`;
      }
    });
    
    return mermaid;
  }
  
  static generateErrorFlow(snapshots: ApiSnapshot[]): string {
    const errorSnapshots = snapshots.filter(s => s.response.status >= 400);
    
    if (errorSnapshots.length === 0) {
      return 'sequenceDiagram\n    Note over Client,Server: No errors recorded';
    }

    let mermaid = 'sequenceDiagram\n';
    mermaid += '    participant Client\n';
    mermaid += '    participant Server\n';
    mermaid += '    participant ErrorHandler\n';
    
    errorSnapshots.forEach(snapshot => {
      const method = snapshot.request.method;
      const path = new URL(snapshot.request.url).pathname;
      const status = snapshot.response.status;
      
      mermaid += `    Client->>Server: ${method} ${path}\n`;
      mermaid += `    Server->>ErrorHandler: Process Error\n`;
      mermaid += `    ErrorHandler-->>Server: Error ${status}\n`;
      mermaid += `    Server-->>Client: ${status} Error\n`;
    });
    
    return mermaid;
  }
  
  static generatePerformanceFlow(snapshots: ApiSnapshot[]): string {
    if (snapshots.length === 0) {
      return 'sequenceDiagram\n    Note over Client,Server: No data available';
    }

    const avgDuration = snapshots.reduce((sum, s) => sum + s.response.duration, 0) / snapshots.length;
    const slowSnapshots = snapshots.filter(s => s.response.duration > avgDuration * 1.5);
    
    let mermaid = 'sequenceDiagram\n';
    mermaid += '    participant Client\n';
    mermaid += '    participant Server\n';
    mermaid += '    participant Database\n';
    
    mermaid += `    Note over Client,Database: Average Response Time: ${Math.round(avgDuration)}ms\n`;
    
    snapshots.forEach(snapshot => {
      const method = snapshot.request.method;
      const path = new URL(snapshot.request.url).pathname;
      const duration = snapshot.response.duration;
      const isSlow = slowSnapshots.includes(snapshot);
      
      mermaid += `    Client->>Server: ${method} ${path}\n`;
      
      if (isSlow) {
        mermaid += `    Server->>Database: Complex Query\n`;
        mermaid += `    Database-->>Server: Slow Response\n`;
        mermaid += `    Note over Server,Database: ${duration}ms (SLOW)\n`;
      } else {
        mermaid += `    Server->>Database: Simple Query\n`;
        mermaid += `    Database-->>Server: Fast Response\n`;
      }
      
      mermaid += `    Server-->>Client: ${snapshot.response.status} (${duration}ms)\n`;
    });
    
    return mermaid;
  }
}