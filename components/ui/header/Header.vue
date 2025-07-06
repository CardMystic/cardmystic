<template>
    <header class="w-full bg-zinc-900 border-b border-zinc-800 py-3 px-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <img src="/favicon.ico" alt="CardMystic Logo" class="w-8 h-8 rounded" />
            <span class="text-xl font-bold text-purple-400 tracking-tight">CardMystic</span>
        </div>
        <nav class="flex items-center gap-6">
            <a href="/" class="text-zinc-200 hover:text-purple-400 transition-colors">Home</a>
            <a href="/search" class="text-zinc-200 hover:text-purple-400 transition-colors">Results</a>
            <a href="/about" class="text-zinc-200 hover:text-purple-400 transition-colors">About</a>
            <a href="/contact" class="text-zinc-200 hover:text-purple-400 transition-colors">Contact</a>
        </nav>
        <a href="https://www.patreon.com/" target="_blank" rel="noopener" class="ml-4">
            <button
                class="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-1 rounded shadow transition-colors">Support
                us on Patreon!</button>
        </a>
    </header>
</template>

<script setup lang="ts">
defineOptions({ name: "AppHeader" });
</script>
