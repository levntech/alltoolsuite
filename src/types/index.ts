export interface Tool {
    title: string;
    desc: string;
    path: string;
    icon: string; // Icon name from FontAwesome
    iconColor?: string;
  }

  export interface Category {
    icon: string;
    title: string;
    desc: string;
    path: string;
    color: string; // CSS class for color
    tools: Tool[];

  }