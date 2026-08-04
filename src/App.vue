<script setup>
import NavBar from '@/components/NavBar.vue'
</script>

<template>
  <NavBar />
  <main class="main-content">
    <router-view />
  </main>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  z-index:1;
}

body {
  background-color: black;
  color: #ffffff;
 
}

.main-content {
  width: 100%;
  padding: 0;
  margin: 0;
  background-color: black;
  z-index:1;
   width: 100%;
  height: 100%; 
}
</style>
