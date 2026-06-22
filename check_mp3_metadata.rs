extern crate mp3_metadata;
fn main() {
    // This will fail to compile if it's not a u16
    let x: u16 = 0;
    let _y: u16 = x;
}
