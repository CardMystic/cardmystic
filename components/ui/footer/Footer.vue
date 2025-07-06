<template>
    <footer
        class="w-full bg-zinc-900 border-t border-zinc-800 py-4 px-4 flex flex-col sm:flex-row items-center justify-between text-zinc-400 text-sm mt-8">
        <div class="flex items-center gap-2 mb-2 sm:mb-0">
            <span>&copy; {{ new Date().getFullYear() }} CardMystic</span>
            <span class="hidden sm:inline">|</span>
            <a href="https://discord.gg/GmPZ3e7tZH" target="_blank">Discord</a>
            <span class="hidden sm:inline">|</span>
            <a href="/about" class="hover:text-purple-400 transition-colors">About</a>
            <span class="hidden sm:inline">|</span>
            <a href="/contact" class="hover:text-purple-400 transition-colors">Contact</a>
        </div>
        <div class="flex items-center gap-2">
            <a href="https://discord.gg/GmPZ3e7tZH" target="_blank">Discord</a>
            <span class="hidden sm:inline">|</span>
            <span>Made with <span class="text-purple-400">♥</span> by the CardMystic Team</span>
        </div>
    </footer>
</template>

<script setup lang="ts">
defineOptions({ name: "AppFooter" });
</script>
