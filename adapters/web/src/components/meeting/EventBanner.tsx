import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  event: { title: string; description: string } | null;
  onDismiss: () => void;
}

export default function EventBanner({ event, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="absolute top-0 left-0 right-0 z-10 p-3 bg-red-900/90 border-b border-red-700 backdrop-blur-sm cursor-pointer"
          onClick={onDismiss}
        >
          <div className="text-center">
            <span className="text-red-300 text-xs font-semibold">EVENT</span>
            <p className="text-sm font-bold text-white">{event.title}</p>
            <p className="text-xs text-red-200">{event.description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
