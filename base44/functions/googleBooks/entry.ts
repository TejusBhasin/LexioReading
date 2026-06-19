import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const BASE_URL = 'https://www.googleapis.com/books/v1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const API_KEY = Deno.env.get('GOOGLE_BOOKS_API_KEY');
    if (!API_KEY) return Response.json({ error: 'API key not configured' }, { status: 500 });

    const { action, query, maxResults = 12, bookId } = await req.json();

    if (action === 'search') {
      const url = `${BASE_URL}/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      return Response.json({ items: data.items || [] });
    }

    if (action === 'get') {
      const url = `${BASE_URL}/volumes/${bookId}?key=${API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      return Response.json({ item: data });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});