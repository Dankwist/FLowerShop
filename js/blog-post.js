const posts = {
    1: {
        title: "Best flowers for inside home",
        category: "FLOWER GUIDE",
        author: "Emily",
        date: "2026/09/20",
        image: "../img-flower/flower-dom1.png",
        content: `
            <p>Flowers can completely change the atmosphere of a room. Even a small bouquet can make a space feel warmer, fresher and more alive.</p>

            <h2>Choose flowers for your space</h2>

            <p>For bright rooms, sunflowers, tulips and other light-loving flowers can create a natural connection with the outside world. For darker spaces, white and pastel flowers can visually add more light.</p>

            <p>The most important thing is choosing flowers that you actually like. Your home should feel personal, not like a showroom.</p>

            <h2>Keep them fresh</h2>

            <p>Change the water regularly, cut the stems at an angle and keep the bouquet away from direct heat. A little attention can make your flowers last much longer.</p>
        `
    },

    2: {
        title: "How to choose flowers for a special moment",
        category: "FLOWER GUIDE",
        author: "Emily",
        date: "2026/09/18",
        image: "../img-flower/flower-dom3.png",
        content: `
            <p>Choosing flowers is not always about picking the most beautiful bouquet. Different flowers can create completely different moods.</p>

            <h2>Think about the feeling</h2>

            <p>Roses can feel romantic, sunflowers energetic, while softer flowers can create a calm and gentle atmosphere.</p>

            <p>Think about the person, the occasion and the message you want to send before choosing the bouquet.</p>

            <h2>Don't overthink it</h2>

            <p>There are no strict rules when it comes to flowers. Sometimes the best bouquet is simply the one that immediately feels right.</p>
        `
    },

    3: {
        title: "Why flowers make a space feel different",
        category: "LIFESTYLE",
        author: "Emily",
        date: "2026/09/15",
        image: "../img-flower/flower-dom2.png",
        content: `
            <p>A room can have the same furniture, lighting and colors, but adding flowers can completely change how the space feels.</p>

            <h2>A small detail with a big effect</h2>

            <p>Flowers introduce natural shapes, colors and textures into an interior. They can become a visual focus without taking over the entire room.</p>

            <p>Try placing a small bouquet on a desk, next to your bed or somewhere near a window. Sometimes one small change is enough.</p>

            <h2>Make it yours</h2>

            <p>There is no perfect arrangement. Mix colors, experiment with different flowers and find combinations that match your own space.</p>
        `
    }
};

const params = new URLSearchParams(window.location.search);
const postId = params.get("id") || "1";
const post = posts[postId];

if (post) {
    document.title = `${post.title} - FlowerShop`;

    document.querySelector("#post-category").textContent = post.category;
    document.querySelector("#post-title").textContent = post.title;
    document.querySelector("#post-author").textContent = post.author;
    document.querySelector("#post-date").textContent = post.date;
    document.querySelector("#post-image").src = post.image;
    document.querySelector("#post-image").alt = post.title;
    document.querySelector("#post-content").innerHTML = post.content;
} else {
    document.querySelector("#post-title").textContent = "Post not found";
    document.querySelector("#post-content").innerHTML = `
        <p>This article doesn't exist.</p>
        <a href="./index.html">Return to home</a>
    `;
}