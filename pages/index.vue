<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-zinc-900">
    <!-- Logo and Cards -->
    <div class="flex flex-col items-center mb-2">
      <div class="relative flex flex-col items-center">
        <img src="/public/crystall_ball.png" alt="Crystal Ball" class="w-32 z-10 drop-shadow-xl" />
      </div>
      <h1
        class="font-display text-[3rem] sm:text-[4rem] font-extrabold text-purple-400 mt-2 leading-none tracking-tight flex items-center">
        CardMystic<span class="animate-blink text-white ml-1">|</span>
      </h1>
      <h2 class="text-lg italic text-purple-300 mt-1">
        <span class="not-italic text-white font-semibold">A.I. Search Engine</span> for Magic: The Gathering
      </h2>
    </div>

    <!-- Mode Buttons -->
    <div class="flex gap-3 mt-4 mb-6">
      <Button variant="secondary" class="bg-purple-500 text-white px-5 py-1 rounded-full flex items-center gap-1">
        Vector <span class="ml-1">
          <HelpCircle class="w-4 h-4" />
        </span>
      </Button>
      <Button variant="outline"
        class="bg-zinc-800 text-white px-5 py-1 rounded-full flex items-center gap-1 border border-zinc-600">
        Keyword <span class="ml-1">
          <HelpCircle class="w-4 h-4" />
        </span>
      </Button>
      <Button variant="ghost"
        class="bg-zinc-800 text-zinc-400 px-5 py-1 rounded-full flex items-center gap-1 border border-zinc-700 cursor-not-allowed opacity-60"
        disabled>
        Image <span class="ml-1">
          <HelpCircle class="w-4 h-4" />
        </span>
      </Button>
      <span class="text-xs text-zinc-400 mt-2 ml-[-10px]">Coming Soon!</span>
    </div>

    <!-- Search Bar -->
    <div class="w-full max-w-2xl flex flex-col gap-2">
      <div class="rounded-md bg-zinc-800 px-4 py-3 flex items-center shadow focus-within:ring-2 ring-purple-400">
        <input class="w-full bg-transparent text-white placeholder-zinc-400 outline-none border-none text-base"
          placeholder="Creatures that let you cast cards from your graveyard" aria-label="Search" />
      </div>
      <div>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="w-full justify-between bg-white text-zinc-900 border-zinc-300">
              Filters
              <ChevronDown class="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-full max-w-2xl">
            <!-- Filters content goes here -->
            <div class="p-4 text-zinc-700">(Filters UI here)</div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "IndexPage" });

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { ChevronDown, HelpCircle } from "lucide-vue-next";
</script>

<style scoped>
@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

.animate-blink {
  animation: blink 1.2s steps(1) infinite;
}
</style>
