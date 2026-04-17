import { EventEmitter } from 'events';

export type EventType = 
  | 'LEAD_CREATED'
  | 'LEAD_UPDATED'
  | 'LEAD_SCORED'
  | 'LEAD_ASSIGNED'
  | 'CALL_COMPLETED'
  | 'TASK_CREATED'
  | 'TASK_DUE'
  | 'UNIT_BLOCKED'
  | 'UNIT_SOLD'
  | 'CAMPAIGN_STARTED'
  | 'PAYMENT_RECEIVED';

export interface AppEvent<T = any> {
  type: EventType;
  payload: T;
  timestamp: Date;
  id: string; // Correlation ID
}

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(50); // Allow many listeners for our OS
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public publish<T>(type: EventType, payload: T) {
    const event: AppEvent<T> = {
      type,
      payload,
      timestamp: new Date(),
      id: crypto.randomUUID()
    };
    
    console.log(`[EventBus] Publishing: ${type}`, payload);
    this.emit(type, event);
    this.emit('*', event); // Wildcard listener
  }

  public subscribe<T>(type: EventType, handler: (event: AppEvent<T>) => void) {
    this.on(type, handler);
    return () => this.off(type, handler);
  }
}

export const eventBus = EventBus.getInstance();
