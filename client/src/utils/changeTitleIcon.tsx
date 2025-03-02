export const changeTitleAndFavicon = (title: string, faviconUrl: string): void => {
    // Update the document title
    document.title = title;
    
    // Find existing favicon link element
    let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    
    // If no favicon link exists, create one
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    
    // Update the favicon href
    favicon.href = faviconUrl;
    
    console.log(`Title changed to "${title}" and favicon changed to "${faviconUrl}"`);
  };
  