<template>
    <q-input
      v-model="text"
      filled
      type="textarea"
      style="width:100%"
      @update:modelValue="onInput"
    />
</template>
<script>
// import Vue from 'vue'

export default {
  props: ['modelValue'],
  data () {
    return {
      text: this.modelValue
    }
  },
  methods: {
    onInput () {
      this.$emit('update:modelValue', this.text)
    }
  },
  mounted () {
    // Vue.nextTick(() => {
    // })
  }
}
</script>
