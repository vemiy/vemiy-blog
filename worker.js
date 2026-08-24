// Test Worker: return fixed response, no env.ASSETS.fetch
export default {
  async fetch() {
    return new Response('<h1>WORKER IS RUNNING</h1>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
