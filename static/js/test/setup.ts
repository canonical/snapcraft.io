class ResizeObserverMock implements ResizeObserver {
  observe(): void {}

  unobserve(): void {}

  disconnect(): void {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
