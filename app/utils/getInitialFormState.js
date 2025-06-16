export const getInitialFormState = () => ({
  content: "",
  platforms: [],
  images: [],
  scheduledAt: "",
  postNow: false,
  recurring: {
    enabled: false,
    frequency: "",
    repeatCount: "",
    untilDate: "",
  },
  variants: {
    enabled: false,
    variants: [],
  },
  postFormat: {
    thread: [{ text: "", image: null }],
    carousel: [],
  },
});
