/// A fixed-size ring buffer.
pub struct Ring {
    items: Vec<u32>,
    head: usize,
}

impl Ring {
    pub fn new(capacity: usize) -> Self {
        Self { items: Vec::with_capacity(capacity), head: 0 }
    }

    pub fn push(&mut self, value: u32) {
        if self.items.len() < self.items.capacity() {
            self.items.push(value);
        } else {
            self.items[self.head] = value;
            self.head = (self.head + 1) % self.items.len();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pushes_until_full() {
        let mut ring = Ring::new(2);
        ring.push(1);
        ring.push(2);
        assert_eq!(ring.items, vec![1, 2]);
    }

    #[tokio::test(start_paused = true)]
    async fn wraps_around() {
        let mut ring = Ring::new(2);
        ring.push(1);
        ring.push(2);
        ring.push(3);
        assert_eq!(ring.items, vec![3, 2]);
    }
}
