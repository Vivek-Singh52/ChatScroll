const CACHE_NAME = 'chatscroll-shared-files';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Intercept Web Share Target POST request
  if (event.request.method === 'POST' && url.searchParams.get('shared') === 'true') {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const file = formData.get('chatfile');
        
        if (file) {
          // Open cache and save the file as a Response object
          const cache = await caches.open(CACHE_NAME);
          
          // Store the file type and name in headers so we can reconstruct the File object later
          const headers = new Headers({
            'Content-Type': file.type || 'text/plain',
            'Content-Length': file.size.toString(),
            'X-File-Name': file.name || 'shared_chat'
          });
          
          const response = new Response(file, { headers });
          await cache.put('/shared-file', response);
          
          // Redirect the user to the main page where we will load the file from cache
          return Response.redirect('/?shared_loaded=true', 303);
        }
      } catch (error) {
        console.error('Error handling shared file:', error);
      }
      
      // Fallback redirect if something fails
      return Response.redirect('/', 303);
    })());
  }
});
